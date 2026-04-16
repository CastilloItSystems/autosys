// backend/src/features/workshop/serviceOrders/serviceOrders.service.ts
import type { PrismaClient } from '../../../generated/prisma/client.js'
import {
  NotFoundError,
  BadRequestError,
} from '../../../shared/utils/apiError.js'
import type {
  CreateServiceOrderDTO,
  UpdateServiceOrderDTO,
  UpdateStatusDTO,
} from './serviceOrders.dto.js'
import type {
  ServiceOrderStatus,
  IServiceOrderFilters,
} from './serviceOrders.interface.js'
// FASE 1.5: Import quote validation
import { validateSOQuoteApproval } from '../integrations/quote-so-converter.service.js'
import { handleSOQualityCheckTransition } from '../integrations/quality-check-integrator.service.js'
import { handleSODeliveryTransition } from '../integrations/delivery-integrator.service.js'
import {
  changeServiceOrderStatusWithHistory,
  findServiceOrderStatusHistory as findServiceOrderStatusHistoryEntries,
} from './serviceOrderStatusHistory.service.js'
import { getBillableServiceOrderItems } from '../integrations/billing-eligibility.service.js'

type PrismaClientType =
  | PrismaClient
  | Omit<
      PrismaClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >

const VALID_TRANSITIONS: Record<ServiceOrderStatus, ServiceOrderStatus[]> = {
  DRAFT: ['OPEN', 'CANCELLED'],
  OPEN: ['DIAGNOSING', 'IN_PROGRESS', 'CANCELLED'],
  DIAGNOSING: ['PENDING_APPROVAL', 'APPROVED', 'CANCELLED'],
  PENDING_APPROVAL: ['APPROVED', 'CANCELLED'],
  APPROVED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: [
    'PAUSED',
    'WAITING_PARTS',
    'WAITING_AUTH',
    'QUALITY_CHECK',
    'CANCELLED',
  ],
  PAUSED: ['IN_PROGRESS', 'CANCELLED'],
  WAITING_PARTS: ['IN_PROGRESS', 'CANCELLED'],
  WAITING_AUTH: ['IN_PROGRESS', 'CANCELLED'],
  QUALITY_CHECK: ['READY', 'IN_PROGRESS'],
  READY: ['DELIVERED', 'IN_PROGRESS'],
  DELIVERED: ['INVOICED'],
  INVOICED: ['CLOSED'],
  CLOSED: [],
  CANCELLED: [],
}

const SERVICE_ORDER_ITEM_INCLUDE = {
  include: {
    item: { select: { id: true, code: true, sku: true, name: true } },
    operation: { select: { id: true, code: true, name: true } },
  },
} as const

// Genera folio SO-XXXX por empresa usando SELECT FOR UPDATE para evitar duplicados
export async function generateFolio(
  prisma: PrismaClientType,
  empresaId: string
): Promise<string> {
  // Raw query con lock para evitar race condition en creaciones concurrentes
  const result = await (prisma as PrismaClient).$queryRaw<{ folio: string }[]>`
    SELECT folio FROM service_orders
    WHERE "empresaId" = ${empresaId}
    ORDER BY "createdAt" DESC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  `
  const last = result[0]
  const lastNum = last ? parseInt(last.folio.replace('SO-', ''), 10) : 0
  const next = lastNum + 1
  return `SO-${String(next).padStart(4, '0')}`
}

async function generateWorkshopQuotationNumber(
  prisma: PrismaClientType,
  empresaId: string
): Promise<string> {
  const result = await (prisma as PrismaClient).$queryRaw<{ num: bigint }[]>`
    SELECT COUNT(*) AS num FROM workshop_quotations WHERE "empresaId" = ${empresaId}
  `
  const next = Number(result[0]?.num ?? 0) + 1
  return `COT-${String(next).padStart(4, '0')}`
}

function calcTotals(
  items: {
    type: string
    quantity: number
    unitPrice: number
    discountPct?: number
    taxRate?: number
    taxType?: string
  }[]
) {
  let laborTotal = 0
  let partsTotal = 0
  let otherTotal = 0
  let subtotal = 0
  let taxAmt = 0

  for (const item of items) {
    const gross = item.quantity * item.unitPrice
    const discount = ((item.discountPct ?? 0) * gross) / 100
    const base = gross - discount
    const rate = item.taxType === 'EXEMPT' ? 0 : (item.taxRate ?? 0.16)
    const tax = base * rate

    subtotal += base
    taxAmt += tax

    if (item.type === 'LABOR') laborTotal += base
    else if (item.type === 'PART') partsTotal += base
    else otherTotal += base
  }

  return {
    laborTotal,
    partsTotal,
    otherTotal,
    subtotal,
    taxAmt,
    total: subtotal + taxAmt,
  }
}

export async function createServiceOrder(
  prisma: PrismaClientType,
  empresaId: string,
  userId: string,
  dto: CreateServiceOrderDTO
) {
  // Verificar cliente
  const customer = await (prisma as PrismaClient).customer.findFirst({
    where: { id: dto.customerId, empresaId },
    select: { id: true, name: true },
  })
  if (!customer) throw new NotFoundError('Cliente no encontrado')

  // Snapshot de vehículo si se proveyó
  let vehiclePlate = dto.vehiclePlate
  let vehicleDesc = dto.vehicleDesc
  if (dto.customerVehicleId) {
    const vehicle = await (prisma as PrismaClient).customerVehicle.findFirst({
      where: { id: dto.customerVehicleId, customerId: dto.customerId },
      select: {
        plate: true,
        vehicleModel: { select: { name: true } },
        brand: { select: { name: true } },
        year: true,
        color: true,
      },
    })
    if (vehicle) {
      vehiclePlate = vehiclePlate ?? vehicle.plate
      vehicleDesc =
        vehicleDesc ??
        [
          vehicle.brand?.name,
          vehicle.vehicleModel?.name,
          vehicle.year,
          vehicle.color,
        ]
          .filter(Boolean)
          .join(' ')
    }
  }

  const folio = await generateFolio(prisma, empresaId)

  // M2: Para items tipo PART con itemId, tomar snapshot del nombre del catálogo
  const enrichedItems = await Promise.all(
    (dto.items ?? []).map(async (i) => {
      if (i.itemId) {
        const catalogItem = await (prisma as PrismaClient).item.findFirst({
          where: { id: i.itemId, empresaId },
          select: { name: true, sku: true },
        })
        if (catalogItem) {
          return { ...i, itemName: catalogItem.name }
        }
      }
      return i
    })
  )

  // M3: Calcular totales ANTES de hacer string conversion
  const { laborTotal, partsTotal, otherTotal, subtotal, taxAmt, total } =
    calcTotals(enrichedItems as any)

  // M4: Convertir items para Prisma (todos los Decimals como strings)
  const itemsWithTotals = enrichedItems.map((i) => {
    const qty = Number(i.quantity) || 1
    const price = Number(i.unitPrice) || 0
    const discount = Number((i as any).discountPct ?? 0) / 100
    const taxRate =
      (i as any).taxType === 'EXEMPT' ? 0 : Number((i as any).taxRate ?? 0.16)
    const total = qty * price * (1 - discount) * (1 + taxRate)

    return {
      ...i,
      quantity: qty.toString(),
      unitPrice: price.toString(),
      unitCost: Number((i as any).unitCost ?? 0).toString(),
      discountPct: Number((i as any).discountPct ?? 0).toString(),
      taxRate: taxRate.toString(),
      total: total.toString(),
    }
  })

  // Utilizar transacción si es PrismaClient
  const client = prisma as any

  let order
  const createData: any = {
    folio,
    empresaId,
    customerId: dto.customerId,
    priority: dto.priority,
    serviceTypeId: dto.serviceTypeId ?? null,
    bayId: dto.bayId ?? null,
    customerVehicleId: dto.customerVehicleId ?? null,
    receptionId: dto.receptionId ?? null,
    vehiclePlate: vehiclePlate ?? null,
    vehicleDesc: vehicleDesc ?? null,
    mileageIn: dto.mileageIn ?? null,
    diagnosisNotes: dto.diagnosisNotes ?? null,
    internalNotes: dto.observations ?? null, // Map observations to internalNotes (Prisma schema naming)
    assignedTechnicianId: dto.assignedTechnicianId ?? null,
    estimatedDelivery: dto.estimatedDelivery ?? null,
    laborTotal: laborTotal.toString(),
    partsTotal: partsTotal.toString(),
    otherTotal: otherTotal.toString(),
    subtotal: subtotal.toString(),
    taxAmt: taxAmt.toString(),
    total: total.toString(),
    createdBy: userId,
    items: {
      create: itemsWithTotals,
    },
  }

  console.log(
    'Creating service order with data:',
    JSON.stringify(createData, null, 2)
  )

  const includeConfig = {
    customer: { select: { id: true, name: true, code: true } },
    customerVehicle: { select: { id: true, plate: true } },
    items: SERVICE_ORDER_ITEM_INCLUDE,
  }

  if (client.$transaction && dto.receptionId) {
    // Si viene receptionId, actualizamos su estado y la vinculamos
    const [createdOrder] = await client.$transaction([
      client.serviceOrder.create({
        data: createData,
        include: includeConfig,
      }),
      // Usar updateMany cuando queremos filtrar por empresaId además del id
      // (update espera una clave única; pasar empresaId provoca error de validación)
      client.vehicleReception.updateMany({
        where: { id: dto.receptionId, empresaId },
        data: { status: 'CONVERTED_TO_SO' },
      }),
    ])
    order = createdOrder
  } else {
    order = await (prisma as PrismaClient).serviceOrder.create({
      data: createData as any,
      include: includeConfig,
    })
  }

  return order
}

export async function findAllServiceOrders(
  prisma: PrismaClientType,
  empresaId: string,
  filters: IServiceOrderFilters
) {
  const {
    status,
    customerId,
    assignedTechnicianId,
    search,
    dateFrom,
    dateTo,
    page = 1,
    limit = 20,
    sortBy = 'receivedAt',
    sortOrder = 'desc',
  } = filters

  const where: any = { empresaId }
  if (status) where.status = status
  if (customerId) where.customerId = customerId
  if (assignedTechnicianId) where.assignedTechnicianId = assignedTechnicianId
  if (dateFrom || dateTo) {
    where.receivedAt = {}
    if (dateFrom) where.receivedAt.gte = new Date(dateFrom)
    if (dateTo) where.receivedAt.lte = new Date(dateTo)
  }
  if (search) {
    where.OR = [
      { folio: { contains: search, mode: 'insensitive' } },
      { vehiclePlate: { contains: search, mode: 'insensitive' } },
      { vehicleDesc: { contains: search, mode: 'insensitive' } },
      { customer: { name: { contains: search, mode: 'insensitive' } } },
    ]
  }

  const skip = (page - 1) * limit
  const [data, total] = await Promise.all([
    (prisma as PrismaClient).serviceOrder.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        customer: { select: { id: true, name: true, code: true } },
        customerVehicle: { select: { id: true, plate: true } },
        items: SERVICE_ORDER_ITEM_INCLUDE,
        qualityCheck: { select: { id: true, status: true } },
        preInvoice: {
          select: {
            id: true,
            preInvoiceNumber: true,
            status: true,
            baseImponible: true,
            taxRate: true,
            taxAmount: true,
            igtfApplies: true,
            igtfRate: true,
            igtfAmount: true,
            total: true,
            createdAt: true,
          },
        },
        consolidatedPreInvoice: {
          select: {
            id: true,
            preInvoiceNumber: true,
            status: true,
            baseImponible: true,
            taxRate: true,
            taxAmount: true,
            igtfApplies: true,
            igtfRate: true,
            igtfAmount: true,
            total: true,
            createdAt: true,
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            fiscalNumber: true,
            status: true,
            total: true,
            createdAt: true,
          },
        },
      },
    }),
    (prisma as PrismaClient).serviceOrder.count({ where }),
  ])

  return { data, page, limit, total }
}

export async function findServiceOrderById(
  prisma: PrismaClientType,
  id: string,
  empresaId: string
) {
  const order = await (prisma as PrismaClient).serviceOrder.findFirst({
    where: { id, empresaId },
    include: {
      customer: {
        select: { id: true, name: true, code: true, phone: true, mobile: true },
      },
      customerVehicle: {
        select: { id: true, plate: true, vin: true, year: true, color: true },
      },
      items: SERVICE_ORDER_ITEM_INCLUDE,
      preInvoice: {
        select: {
          id: true,
          preInvoiceNumber: true,
          status: true,
          baseImponible: true,
          taxRate: true,
          taxAmount: true,
          igtfApplies: true,
          igtfRate: true,
          igtfAmount: true,
          total: true,
          createdAt: true,
        },
      },
      consolidatedPreInvoice: {
        select: {
          id: true,
          preInvoiceNumber: true,
          status: true,
          baseImponible: true,
          taxRate: true,
          taxAmount: true,
          igtfApplies: true,
          igtfRate: true,
          igtfAmount: true,
          total: true,
          createdAt: true,
        },
      },
      invoice: {
        select: {
          id: true,
          invoiceNumber: true,
          fiscalNumber: true,
          status: true,
          total: true,
          createdAt: true,
        },
      },
      quotations: {
        orderBy: { createdAt: 'desc' },
        include: {
          items: { orderBy: { order: 'asc' } },
          approvals: { orderBy: { approvedAt: 'desc' } },
        },
      },
    },
  })
  if (!order) throw new NotFoundError('Orden de taller no encontrada')
  return order
}

export async function createWorkshopQuotationFromServiceOrder(
  prisma: PrismaClientType,
  id: string,
  empresaId: string,
  userId: string
) {
  const serviceOrder = await (prisma as PrismaClient).serviceOrder.findFirst({
    where: { id, empresaId },
    include: {
      items: true,
      customer: { select: { id: true, name: true, code: true, phone: true } },
      customerVehicle: { select: { id: true, plate: true } },
    },
  })

  if (!serviceOrder) {
    throw new NotFoundError('Orden de taller no encontrada')
  }

  const existingOpenQuotation = await (
    prisma as PrismaClient
  ).workshopQuotation.findFirst({
    where: {
      empresaId,
      serviceOrderId: id,
      status: {
        in: [
          'DRAFT',
          'ISSUED',
          'SENT',
          'PENDING_APPROVAL',
          'APPROVED_TOTAL',
          'APPROVED_PARTIAL',
        ],
      },
    },
    include: {
      customer: { select: { id: true, name: true, code: true, phone: true } },
      customerVehicle: { select: { id: true, plate: true } },
      serviceOrder: { select: { id: true, folio: true, status: true } },
      items: { orderBy: { order: 'asc' } },
      approvals: { orderBy: { approvedAt: 'desc' } },
    },
  })

  if (existingOpenQuotation) {
    return existingOpenQuotation
  }

  if (!serviceOrder.items.length) {
    throw new BadRequestError(
      'La OT no tiene ítems para crear una cotización de taller'
    )
  }

  const quotationNumber = await generateWorkshopQuotationNumber(prisma, empresaId)

  let laborTotal = 0
  let partsTotal = 0
  let otherTotal = 0
  let subtotal = 0
  let discount = 0
  let taxAmt = 0
  let total = 0

  const quotationItems = serviceOrder.items.map((item, idx) => {
    const quantity = Number(item.quantity)
    const unitPrice = Number(item.unitPrice)
    const discountPct = Number(item.discountPct ?? 0)
    const taxType = (item.taxType as any) ?? 'IVA'
    const taxRate = Number(item.taxRate ?? 0.16)

    const lineSubtotal = quantity * unitPrice
    const lineDiscount = (discountPct / 100) * lineSubtotal
    const lineBase = lineSubtotal - lineDiscount
    const lineTax =
      taxType === 'EXEMPT' ? 0 : Number(item.taxAmount ?? lineBase * taxRate)
    const lineTotal = Number(item.total ?? lineBase + lineTax)

    const quotationType: 'LABOR' | 'PART' | 'EXTERNAL_SERVICE' =
      item.type === 'LABOR'
        ? 'LABOR'
        : item.type === 'PART'
          ? 'PART'
          : 'EXTERNAL_SERVICE'

    if (quotationType === 'LABOR') laborTotal += lineBase
    else if (quotationType === 'PART') partsTotal += lineBase
    else otherTotal += lineBase

    subtotal += lineSubtotal
    discount += lineDiscount
    taxAmt += lineTax
    total += lineTotal

    return {
      type: quotationType,
      referenceId:
        quotationType === 'LABOR'
          ? item.operationId ?? null
          : quotationType === 'PART'
            ? item.itemId ?? null
            : null,
      description: item.description,
      quantity,
      unitPrice,
      unitCost: Number(item.unitCost ?? 0),
      discountPct,
      taxType,
      taxRate,
      taxAmount: lineTax,
      subtotal: lineSubtotal,
      total: lineTotal,
      approved: true,
      order: idx,
    }
  })

  const created = await (prisma as PrismaClient).workshopQuotation.create({
    data: {
      quotationNumber,
      status: 'DRAFT',
      version: 1,
      receptionId: serviceOrder.receptionId ?? null,
      serviceOrderId: serviceOrder.id,
      customerId: serviceOrder.customerId,
      customerVehicleId: serviceOrder.customerVehicleId ?? null,
      validUntil: serviceOrder.estimatedDelivery ?? null,
      notes: serviceOrder.diagnosisNotes ?? null,
      internalNotes: serviceOrder.internalNotes ?? null,
      laborTotal,
      partsTotal,
      otherTotal,
      subtotal,
      discount,
      taxAmt,
      total,
      empresaId,
      createdBy: userId,
      items: {
        create: quotationItems,
      },
    },
    include: {
      customer: { select: { id: true, name: true, code: true, phone: true } },
      customerVehicle: { select: { id: true, plate: true } },
      serviceOrder: { select: { id: true, folio: true, status: true } },
      items: { orderBy: { order: 'asc' } },
      approvals: { orderBy: { approvedAt: 'desc' } },
      supplementaries: {
        select: {
          id: true,
          quotationNumber: true,
          status: true,
          total: true,
          createdAt: true,
          items: { orderBy: { order: 'asc' } },
        },
      },
    },
  })

  return created
}

export async function updateServiceOrder(
  prisma: PrismaClientType,
  id: string,
  empresaId: string,
  dto: UpdateServiceOrderDTO
) {
  const existing = await findServiceOrderById(prisma, id, empresaId)
  if (
    ['DELIVERED', 'INVOICED', 'CLOSED', 'CANCELLED'].includes(existing.status)
  ) {
    throw new BadRequestError(
      'No se puede editar una orden entregada, facturada, cerrada o cancelada'
    )
  }

  const { items, observations, ...fields } = dto
  let totalsUpdate = {}

  if (items !== undefined) {
    const itemsWithTotals = items.map((i) => ({
      ...i,
      total:
        i.quantity *
        i.unitPrice *
        (1 - (i.discountPct ?? 0) / 100) *
        (1 + (i.taxType === 'EXEMPT' ? 0 : (i.taxRate ?? 0.16))),
    }))
    const { laborTotal, partsTotal, otherTotal, subtotal, taxAmt, total } =
      calcTotals(itemsWithTotals)
    totalsUpdate = {
      laborTotal,
      partsTotal,
      otherTotal,
      subtotal,
      taxAmt,
      total,
    }

    // Reemplazar items en transacción para evitar pérdida de datos si createMany falla
    await (prisma as PrismaClient).$transaction([
      (prisma as PrismaClient).serviceOrderItem.deleteMany({
        where: { serviceOrderId: id },
      }),
      (prisma as PrismaClient).serviceOrderItem.createMany({
        data: itemsWithTotals.map((i) => ({ ...i, serviceOrderId: id })) as any,
      }),
    ])
  }

  // Map observations to internalNotes (Prisma schema naming)
  const updateData = { ...(fields as any), ...totalsUpdate }
  if (observations !== undefined) {
    updateData.internalNotes = observations
  }

  const updated = await (prisma as PrismaClient).serviceOrder.update({
    where: { id },
    data: updateData,
    include: {
      customer: { select: { id: true, name: true, code: true } },
      customerVehicle: { select: { id: true, plate: true } },
      items: SERVICE_ORDER_ITEM_INCLUDE,
    },
  })

  return updated
}

export async function updateServiceOrderStatus(
  prisma: PrismaClientType,
  id: string,
  empresaId: string,
  dto: UpdateStatusDTO,
  userId: string
) {
  const existing = await findServiceOrderById(prisma, id, empresaId)
  const allowed = VALID_TRANSITIONS[existing.status as ServiceOrderStatus]
  if (!allowed.includes(dto.status)) {
    throw new BadRequestError(
      `No se puede pasar de ${existing.status} a ${dto.status}`
    )
  }

  // FASE 1.5: Validate that SO cannot advance past certain states without quote approval
  await validateSOQuoteApproval(prisma, id, dto.status)

  // FASE 1.6: Security check for Quality Control
  await handleSOQualityCheckTransition(prisma, id, dto.status, userId)

  // FASE 2.9: Auto-create VehicleDelivery when SO → DELIVERED
  await handleSODeliveryTransition(prisma, id, dto.status, userId, empresaId)

  // FASE 2.8: Validate PreInvoice status before marking SO as INVOICED
  // Acepta tanto prefactura individual como consolidada
  if (dto.status === 'INVOICED') {
    const soWithPreInvoice = await (
      prisma as PrismaClient
    ).serviceOrder.findFirst({
      where: { id },
      select: {
        preInvoice: { select: { id: true, status: true } },
        consolidatedPreInvoice: { select: { id: true, status: true } },
      },
    })

    const preInvoice =
      soWithPreInvoice?.preInvoice ?? soWithPreInvoice?.consolidatedPreInvoice

    if (!preInvoice) {
      throw new BadRequestError(
        'La OT no tiene una pre-factura. Genera una pre-factura antes de marcar como INVOICED.'
      )
    }

    if (!['READY_FOR_PAYMENT', 'PAID'].includes(preInvoice.status)) {
      throw new BadRequestError(
        `La pre-factura debe estar en READY_FOR_PAYMENT o PAID antes de marcar como INVOICED. Estado actual: ${preInvoice.status}`
      )
    }
  }

  const extra: any = {}
  if (dto.status === 'DELIVERED') extra.deliveredAt = new Date()
  if (dto.status === 'CLOSED') extra.closedAt = new Date()
  if (dto.mileageOut != null) extra.mileageOut = dto.mileageOut

  await changeServiceOrderStatusWithHistory(prisma, {
    serviceOrderId: id,
    empresaId,
    newStatus: dto.status,
    userId,
    comment: dto.comment,
    extraData: extra,
  })

  const updated = await findServiceOrderById(prisma, id, empresaId)

  // Cross-sell: al entregar una orden de taller, crear lead de REPUESTOS si no existe uno abierto
  if (dto.status === 'DELIVERED' && existing.customerId) {
    try {
      const openLead = await (prisma as PrismaClient).lead.findFirst({
        where: {
          customerId: existing.customerId,
          empresaId,
          channel: 'REPUESTOS',
          status: { notIn: ['WON', 'LOST'] },
        },
      })
      if (!openLead) {
        await (prisma as PrismaClient).lead.create({
          data: {
            title: `Seguimiento de repuestos — ${existing.vehiclePlate ?? existing.folio}`,
            channel: 'REPUESTOS',
            source: 'OTHER',
            status: 'NEW',
            customerId: existing.customerId,
            empresaId,
            description: `Auto-generado al entregar orden de taller ${existing.folio}`,
          },
        })
      }
    } catch {
      // Cross-sell es best-effort: no debe bloquear la entrega
    }
  }

  return updated
}

export async function findServiceOrderStatusHistory(
  prisma: PrismaClientType,
  id: string,
  empresaId: string,
  filters: { page?: number; limit?: number }
) {
  return findServiceOrderStatusHistoryEntries(prisma, id, empresaId, filters)
}

export async function deleteServiceOrder(
  prisma: PrismaClientType,
  id: string,
  empresaId: string
) {
  const existing = await findServiceOrderById(prisma, id, empresaId)
  if (!['DRAFT', 'CANCELLED'].includes(existing.status)) {
    throw new BadRequestError(
      'Solo se pueden eliminar órdenes en estado DRAFT o CANCELLED'
    )
  }
  await (prisma as PrismaClient).serviceOrder.delete({ where: { id } })
}

// ─────────────────────────────────────────────────────────────────────────────
// M3: Sincronizar materiales CONSUMED → ítems facturables de la SO
// ─────────────────────────────────────────────────────────────────────────────
export async function syncMaterialsToItems(
  prisma: PrismaClientType,
  id: string,
  empresaId: string,
  userId: string
) {
  const order = await findServiceOrderById(prisma, id, empresaId)

  const consumedMaterials = await (
    prisma as PrismaClient
  ).serviceOrderMaterial.findMany({
    where: { serviceOrderId: id, status: 'CONSUMED' },
  })

  if (consumedMaterials.length === 0) {
    return { synced: 0, message: 'Sin materiales consumidos para sincronizar' }
  }

  // Evitar duplicados: buscar items PART que ya tengan el mismo itemId
  const existingPartItemIds = new Set(
    (order.items as any[])
      .filter((i: any) => i.type === 'PART' && i.itemId)
      .map((i: any) => i.itemId)
  )

  const toCreate = consumedMaterials.filter(
    (m) => m.itemId && !existingPartItemIds.has(m.itemId)
  )

  if (toCreate.length === 0) {
    return {
      synced: 0,
      message: 'Todos los materiales consumidos ya tienen ítem correspondiente',
    }
  }

  const newItems = toCreate.map((m) => {
    const qty = Number(m.quantityConsumed) || Number(m.quantityRequested)
    const base = qty * Number(m.unitPrice)
    const taxRate = 0.16
    return {
      serviceOrderId: id,
      type: 'PART' as const,
      description: m.description,
      itemName: m.description,
      itemId: m.itemId,
      quantity: qty,
      unitPrice: Number(m.unitPrice),
      unitCost: Number(m.unitCost),
      discountPct: 0,
      taxType: 'IVA',
      taxRate,
      taxAmount: base * taxRate,
      total: base * (1 + taxRate),
      stockDeducted: true,
    }
  })

  await (prisma as PrismaClient).serviceOrderItem.createMany({
    data: newItems as any,
  })

  // Recalcular totales
  const allItems = await (prisma as PrismaClient).serviceOrderItem.findMany({
    where: { serviceOrderId: id },
  })
  const totals = calcTotals(
    allItems.map((i) => ({
      type: i.type,
      quantity: Number(i.quantity),
      unitPrice: Number(i.unitPrice),
      discountPct: Number((i as any).discountPct ?? 0),
      taxType: (i as any).taxType ?? 'IVA',
      taxRate: Number((i as any).taxRate ?? 0.16),
    }))
  )

  await (prisma as PrismaClient).serviceOrder.update({
    where: { id },
    data: totals,
  })

  return { synced: newItems.length }
}

// ─────────────────────────────────────────────────────────────────────────────
// M1: Facturación consolidada — generar una PreInvoice para varias OTs del mismo cliente
// ─────────────────────────────────────────────────────────────────────────────
export async function generateConsolidatedPreInvoice(
  prisma: PrismaClientType,
  serviceOrderIds: string[],
  empresaId: string,
  userId: string
) {
  if (serviceOrderIds.length < 2) {
    throw new BadRequestError(
      'Se requieren al menos 2 órdenes para facturación consolidada'
    )
  }

  const orders = await (prisma as PrismaClient).serviceOrder.findMany({
    where: { id: { in: serviceOrderIds }, empresaId },
    select: {
      id: true,
      folio: true,
      status: true,
      customerId: true,
    },
  })

  if (orders.length !== serviceOrderIds.length) {
    throw new NotFoundError('Una o más órdenes no encontradas')
  }

  // Todas deben ser del mismo cliente
  const customerIds = new Set(orders.map((o) => o.customerId))
  if (customerIds.size > 1) {
    throw new BadRequestError(
      'Todas las órdenes deben pertenecer al mismo cliente'
    )
  }

  // Solo OTs facturables (READY o DELIVERED)
  const nonBillable = orders.filter(
    (o) => !['READY', 'DELIVERED'].includes(o.status)
  )
  if (nonBillable.length > 0) {
    throw new BadRequestError(
      `Las siguientes órdenes no están listas para facturar: ${nonBillable.map((o) => o.folio).join(', ')}`
    )
  }

  // Verificar que ninguna ya tenga PreInvoice
  const alreadyInvoiced = await (prisma as PrismaClient).preInvoice.findMany({
    where: {
      OR: [
        { serviceOrderId: { in: serviceOrderIds } },
        {
          consolidatedServiceOrders: { some: { id: { in: serviceOrderIds } } },
        },
      ],
    },
    select: {
      serviceOrderId: true,
      consolidatedServiceOrders: { select: { id: true } },
    },
  })
  if (alreadyInvoiced.length > 0) {
    throw new BadRequestError('Una o más órdenes ya tienen prefactura generada')
  }

  const customerId = orders[0].customerId

  // Cargar ítems facturables (modo mixto) por cada OT
  const ordersWithBillableItems: Array<{
    id: string
    folio: string
    customerId: string
    items: any[]
  }> = []

  const ordersWithoutBillable: string[] = []

  for (const order of orders) {
    const { billableItems } = await getBillableServiceOrderItems(
      prisma,
      order.id,
      empresaId
    )

    if (!billableItems.length) {
      ordersWithoutBillable.push(order.folio)
      continue
    }

    ordersWithBillableItems.push({
      id: order.id,
      folio: order.folio,
      customerId: order.customerId,
      items: billableItems,
    })
  }

  if (ordersWithoutBillable.length > 0) {
    throw new BadRequestError(
      `Sin ítems facturables (modo mixto) en: ${ordersWithoutBillable.join(', ')}`
    )
  }

  // Combinar todos los ítems facturables
  let subtotalBruto = 0
  let baseImponible = 0
  let baseExenta = 0
  let taxAmount = 0

  const allPreInvoiceItems: any[] = []

  for (const order of ordersWithBillableItems) {
    for (const item of order.items as any[]) {
      const lineSubtotal = Number(item.quantity) * Number(item.unitPrice)
      const lineDiscount = (Number(item.discountPct || 0) * lineSubtotal) / 100
      const lineBase = lineSubtotal - lineDiscount
      const normalizedTaxRate = Number(item.taxRate || 0.16)
      const taxRatePct =
        normalizedTaxRate <= 1 ? normalizedTaxRate * 100 : normalizedTaxRate
      const lineTax =
        item.taxType === 'EXEMPT' ? 0 : lineBase * normalizedTaxRate

      if (item.taxType === 'EXEMPT') baseExenta += lineBase
      else baseImponible += lineBase

      subtotalBruto += lineSubtotal
      taxAmount += lineTax

      allPreInvoiceItems.push({
        itemId: item.itemId ?? null,
        itemName: `[${order.folio}] ${item.description}`,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discountPercent: Number(item.discountPct || 0),
        discountAmount: lineDiscount,
        taxType: item.taxType ?? 'IVA',
        taxRate: taxRatePct,
        taxAmount: lineTax,
        subtotal: lineBase,
        totalLine: lineBase + lineTax,
        discount: lineDiscount,
      })
    }
  }

  const total = baseImponible + baseExenta + taxAmount

  // Generar número de prefactura
  const now = new Date()
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  const lastPI = await (prisma as PrismaClient).preInvoice.findFirst({
    where: { empresaId, preInvoiceNumber: { startsWith: `PFC-${yearMonth}` } },
    orderBy: { createdAt: 'desc' },
  })
  const seq = lastPI
    ? parseInt(lastPI.preInvoiceNumber.split('-')[2] || '0') + 1
    : 1
  const preInvoiceNumber = `PFC-${yearMonth}-${String(seq).padStart(6, '0')}`

  const preInvoice = await (prisma as PrismaClient).preInvoice.create({
    data: {
      preInvoiceNumber,
      status: 'PENDING_PREPARATION',
      empresaId,
      customerId,
      currency: 'USD',
      discountAmount: 0,
      subtotalBruto,
      baseImponible,
      baseExenta,
      taxAmount,
      taxRate: 16,
      igtfApplies: false,
      igtfRate: 3,
      igtfAmount: 0,
      total,
      notes: `Prefactura consolidada: ${orders.map((o) => o.folio).join(', ')}`,
      preparedBy: userId,
      preparedAt: now,
      consolidatedServiceOrders: {
        connect: serviceOrderIds.map((id) => ({ id })),
      },
      items: {
        create: allPreInvoiceItems.map((item) => {
          const lineData: any = {
            itemName: item.itemName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountPercent: item.discountPercent,
            discountAmount: item.discountAmount,
            taxType: item.taxType,
            taxRate: item.taxRate,
            taxAmount: item.taxAmount,
            subtotal: item.subtotal,
            totalLine: item.totalLine,
            discount: item.discount,
          }

          if (item.itemId) {
            lineData.item = { connect: { id: item.itemId } }
          }

          return lineData
        }),
      },
    },
    include: {
      items: true,
      consolidatedServiceOrders: { select: { id: true, folio: true } },
    },
  })

  return preInvoice
}

// ─────────────────────────────────────────────────────────────────────────────
// B2: Saldo pendiente de facturación por cliente
// ─────────────────────────────────────────────────────────────────────────────
export async function getPendingBillingByCustomer(
  prisma: PrismaClientType,
  customerId: string,
  empresaId: string
) {
  const orders = await (prisma as PrismaClient).serviceOrder.findMany({
    where: {
      customerId,
      empresaId,
      status: { in: ['READY', 'DELIVERED'] },
      consolidatedPreInvoiceId: null,
      preInvoice: null,
    },
    select: {
      id: true,
      folio: true,
      status: true,
      total: true,
      subtotal: true,
      taxAmt: true,
      receivedAt: true,
      deliveredAt: true,
      vehiclePlate: true,
      vehicleDesc: true,
    },
    orderBy: { receivedAt: 'asc' },
  })

  const pendingTotal = orders.reduce((sum, o) => sum + Number(o.total), 0)

  return {
    customerId,
    pendingOrders: orders.map((o) => ({ ...o, total: Number(o.total) })),
    pendingCount: orders.length,
    pendingTotal,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// B3: OTs estancadas (sin actividad por más días de lo esperado según su estado)
// ─────────────────────────────────────────────────────────────────────────────
export async function getStalledOrders(
  prisma: PrismaClientType,
  empresaId: string,
  thresholds = { waitingPartsDays: 3, pausedDays: 2, waitingAuthDays: 1 }
) {
  const now = new Date()
  const dayMs = 24 * 60 * 60 * 1000

  const cutoffs = {
    WAITING_PARTS: new Date(
      now.getTime() - thresholds.waitingPartsDays * dayMs
    ),
    PAUSED: new Date(now.getTime() - thresholds.pausedDays * dayMs),
    WAITING_AUTH: new Date(now.getTime() - thresholds.waitingAuthDays * dayMs),
  }

  const stalled = await (prisma as PrismaClient).serviceOrder.findMany({
    where: {
      empresaId,
      OR: [
        { status: 'WAITING_PARTS', updatedAt: { lt: cutoffs.WAITING_PARTS } },
        { status: 'PAUSED', updatedAt: { lt: cutoffs.PAUSED } },
        { status: 'WAITING_AUTH', updatedAt: { lt: cutoffs.WAITING_AUTH } },
      ],
    },
    include: {
      customer: { select: { id: true, name: true } },
      customerVehicle: { select: { plate: true } },
    },
    orderBy: { updatedAt: 'asc' },
  })

  return stalled.map((o) => ({
    id: o.id,
    folio: o.folio,
    status: o.status,
    customer: o.customer,
    vehiclePlate: o.vehiclePlate,
    updatedAt: o.updatedAt,
    stalledDays: Math.floor((now.getTime() - o.updatedAt.getTime()) / dayMs),
  }))
}
