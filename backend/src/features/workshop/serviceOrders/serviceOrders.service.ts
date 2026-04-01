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

// Genera folio SO-XXXX por empresa (transaccional)
export async function generateFolio(
  prisma: PrismaClientType,
  empresaId: string
): Promise<string> {
  const last = await (prisma as PrismaClient).serviceOrder.findFirst({
    where: { empresaId },
    orderBy: { createdAt: 'desc' },
    select: { folio: true },
  })
  const lastNum = last ? parseInt(last.folio.replace('SO-', ''), 10) : 0
  const next = lastNum + 1
  return `SO-${String(next).padStart(4, '0')}`
}

function calcTotals(
  items: { type: string; quantity: number; unitPrice: number }[]
) {
  let laborTotal = 0
  let partsTotal = 0
  for (const item of items) {
    const t = item.quantity * item.unitPrice
    if (item.type === 'LABOR') laborTotal += t
    else partsTotal += t
  }
  return { laborTotal, partsTotal, total: laborTotal + partsTotal }
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
  const itemsWithTotals = (dto.items ?? []).map((i) => ({
    ...i,
    total: i.quantity * i.unitPrice,
  }))
  const { laborTotal, partsTotal, total } = calcTotals(itemsWithTotals)

  const order = await (prisma as PrismaClient).serviceOrder.create({
    data: {
      folio,
      empresaId,
      customerId: dto.customerId,
      customerVehicleId: dto.customerVehicleId ?? null,
      vehiclePlate: vehiclePlate ?? null,
      vehicleDesc: vehicleDesc ?? null,
      mileageIn: dto.mileageIn ?? null,
      diagnosisNotes: dto.diagnosisNotes ?? null,
      // observations removed - it's a relation, not a field
      assignedTechnicianId: dto.assignedTechnicianId ?? null,
      estimatedDelivery: dto.estimatedDelivery ?? null,
      laborTotal,
      partsTotal,
      total,
      createdBy: userId,
      items: {
        create: itemsWithTotals,
      },
    },
    include: {
      customer: { select: { id: true, name: true, code: true } },
      customerVehicle: { select: { id: true, plate: true } },
      items: true,
    },
  })

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
        items: true,
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
      items: true,
    },
  })
  if (!order) throw new NotFoundError('Orden de taller no encontrada')
  return order
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
      total: i.quantity * i.unitPrice,
    }))
    const { laborTotal, partsTotal, total } = calcTotals(itemsWithTotals)
    totalsUpdate = { laborTotal, partsTotal, total }

    // Reemplazar items
    await (prisma as PrismaClient).serviceOrderItem.deleteMany({
      where: { serviceOrderId: id },
    })
    await (prisma as PrismaClient).serviceOrderItem.createMany({
      data: itemsWithTotals.map((i) => ({ ...i, serviceOrderId: id })),
    })
  }

  const updated = await (prisma as PrismaClient).serviceOrder.update({
    where: { id },
    data: { ...fields, ...totalsUpdate },
    include: {
      customer: { select: { id: true, name: true, code: true } },
      customerVehicle: { select: { id: true, plate: true } },
      items: true,
    },
  })

  return updated
}

export async function updateServiceOrderStatus(
  prisma: PrismaClientType,
  id: string,
  empresaId: string,
  dto: UpdateStatusDTO
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

  // FASE 2.8: Validate PreInvoice status before marking SO as INVOICED
  if (dto.status === 'INVOICED') {
    // Check if ServiceOrder has a PreInvoice (1-to-1 relationship)
    const preInvoice = await (prisma as PrismaClient).preInvoice.findFirst({
      where: { serviceOrderId: id },
    })

    if (!preInvoice) {
      throw new BadRequestError(
        'Cannot mark ServiceOrder as INVOICED without a PreInvoice. Generate PreInvoice first.'
      )
    }

    if (!['READY_FOR_PAYMENT', 'PAID'].includes(preInvoice.status)) {
      throw new BadRequestError(
        `PreInvoice must be in READY_FOR_PAYMENT or PAID status before marking SO as INVOICED. Current: ${preInvoice.status}`
      )
    }
  }

  const extra: any = {}
  if (dto.status === 'DELIVERED') extra.deliveredAt = new Date()
  if (dto.status === 'CLOSED') extra.closedAt = new Date()
  if (dto.mileageOut != null) extra.mileageOut = dto.mileageOut

  const updated = await (prisma as PrismaClient).serviceOrder.update({
    where: { id },
    data: { status: dto.status, ...extra },
    include: {
      customer: { select: { id: true, name: true, code: true } },
      customerVehicle: { select: { id: true, plate: true } },
      items: true,
    },
  })

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
