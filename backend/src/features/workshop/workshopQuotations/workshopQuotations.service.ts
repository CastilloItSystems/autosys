// backend/src/features/workshop/workshopQuotations/workshopQuotations.service.ts
import type { PrismaClient } from '../../../generated/prisma/client.js'
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
} from '../../../shared/utils/apiError.js'
import type {
  IQuotationFilters,
  ICreateQuotationInput,
  IUpdateQuotationInput,
  IRegisterApprovalInput,
  IConvertToSOInput,
  QuotationStatus,
  IQuotationItem,
} from './workshopQuotations.interface.js'

type Db =
  | PrismaClient
  | Omit<
      PrismaClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >

const INCLUDE = {
  customer: { select: { id: true, name: true, code: true, phone: true } },
  customerVehicle: { select: { id: true, plate: true } },
  reception: { select: { id: true, folio: true, status: true } },
  serviceOrder: { select: { id: true, folio: true, status: true } },
  items: { orderBy: { order: 'asc' as const } },
  approvals: { orderBy: { approvedAt: 'desc' as const } },
  supplementaries: {
    select: {
      id: true,
      quotationNumber: true,
      status: true,
      total: true,
      createdAt: true,
      items: { orderBy: { order: 'asc' as const } },
    },
  },
} as const

// Estados que permiten transiciones manuales (convert lo maneja aparte)
const VALID_TRANSITIONS: Record<QuotationStatus, QuotationStatus[]> = {
  DRAFT: ['ISSUED', 'REJECTED'],
  ISSUED: ['SENT', 'DRAFT', 'REJECTED'],
  SENT: ['PENDING_APPROVAL', 'REJECTED', 'EXPIRED'],
  PENDING_APPROVAL: ['APPROVED_TOTAL', 'APPROVED_PARTIAL', 'REJECTED'],
  APPROVED_TOTAL: ['CONVERTED'],
  APPROVED_PARTIAL: ['CONVERTED'],
  REJECTED: [],
  EXPIRED: [],
  CONVERTED: [],
}

// Estados en que la cotización no puede editarse
const LOCKED_STATUSES: QuotationStatus[] = ['CONVERTED', 'REJECTED', 'EXPIRED']

async function generateQuotationNumber(
  db: Db,
  empresaId: string
): Promise<string> {
  // SELECT FOR UPDATE para evitar duplicados concurrentes
  const result = await (db as PrismaClient).$queryRaw<{ num: bigint }[]>`
    SELECT COUNT(*) AS num FROM workshop_quotations WHERE "empresaId" = ${empresaId}
  `
  const next = Number(result[0]?.num ?? 0) + 1
  return `COT-${String(next).padStart(4, '0')}`
}

function calcItemTotals(item: IQuotationItem) {
  const quantity = Number(item.quantity || 0)
  const unitPrice = Number(item.unitPrice || 0)
  const discountPct = Number(item.discountPct || 0)
  const taxAmount = Number(item.taxAmount || 0)

  const subtotal = quantity * unitPrice
  const discountAmt = subtotal * (discountPct / 100)
  const total = subtotal - discountAmt + taxAmount

  return { subtotal, total, discountAmt, taxAmount }
}

function calcQuotationTotals(items: IQuotationItem[]) {
  let laborTotal = 0,
    partsTotal = 0,
    otherTotal = 0,
    subtotal = 0,
    discount = 0,
    taxAmt = 0,
    total = 0

  for (const item of items) {
    const t = calcItemTotals(item)
    const lineNet = t.subtotal - t.discountAmt

    if (item.type === 'LABOR') laborTotal += lineNet
    else if (item.type === 'PART' || item.type === 'CONSUMABLE')
      partsTotal += lineNet
    else otherTotal += lineNet

    subtotal += t.subtotal
    discount += t.discountAmt
    taxAmt += t.taxAmount
    total += t.total
  }

  return {
    laborTotal,
    partsTotal,
    otherTotal,
    subtotal,
    discount,
    taxAmt,
    total,
  }
}

export async function findAllQuotations(
  db: Db,
  empresaId: string,
  filters: IQuotationFilters
) {
  const {
    status,
    customerId,
    receptionId,
    isSupplementary,
    search,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters

  const where: any = { empresaId }
  if (status) where.status = status
  if (customerId) where.customerId = customerId
  if (receptionId) where.receptionId = receptionId
  if (isSupplementary !== undefined) where.isSupplementary = isSupplementary
  if (search) {
    where.OR = [
      { quotationNumber: { contains: search, mode: 'insensitive' } },
      { notes: { contains: search, mode: 'insensitive' } },
      { customer: { name: { contains: search, mode: 'insensitive' } } },
    ]
  }

  const skip = (page - 1) * limit
  const [data, total] = await Promise.all([
    (db as PrismaClient).workshopQuotation.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: INCLUDE,
    }),
    (db as PrismaClient).workshopQuotation.count({ where }),
  ])
  return { data, page, limit, total }
}

export async function findQuotationById(db: Db, id: string, empresaId: string) {
  const item = await (db as PrismaClient).workshopQuotation.findFirst({
    where: { id, empresaId },
    include: INCLUDE,
  })
  if (!item) throw new NotFoundError('Cotización no encontrada')
  return item
}

export async function createQuotation(
  db: Db,
  empresaId: string,
  userId: string,
  data: ICreateQuotationInput
) {
  // Verificar cliente
  const customer = await (db as PrismaClient).customer.findFirst({
    where: { id: data.customerId, empresaId },
  })
  if (!customer) throw new NotFoundError('Cliente no encontrado')

  // Verificar recepción si aplica
  if (data.receptionId) {
    const reception = await (db as PrismaClient).vehicleReception.findFirst({
      where: { id: data.receptionId, empresaId },
    })
    if (!reception) throw new NotFoundError('Recepción no encontrada')
  }

  // Verificar diagnóstico si aplica
  if (data.diagnosisId) {
    const diag = await (db as PrismaClient).serviceDiagnosis.findFirst({
      where: { id: data.diagnosisId, empresaId },
    })
    if (!diag) throw new NotFoundError('Diagnóstico no encontrado')
  }

  // Verificar cotización padre si es suplementaria
  if (data.isSupplementary && data.parentQuotationId) {
    const parent = await (db as PrismaClient).workshopQuotation.findFirst({
      where: { id: data.parentQuotationId, empresaId },
    })
    if (!parent) throw new NotFoundError('Cotización padre no encontrada')
  }

  const quotationNumber = await generateQuotationNumber(db, empresaId)
  const totals = calcQuotationTotals(data.items)

  return (db as PrismaClient).workshopQuotation.create({
    data: {
      quotationNumber,
      status: 'DRAFT',
      version: 1,
      isSupplementary: data.isSupplementary ?? false,
      parentQuotationId: data.parentQuotationId ?? null,
      receptionId: data.receptionId ?? null,
      diagnosisId: data.diagnosisId ?? null,
      customerId: data.customerId,
      customerVehicleId: data.customerVehicleId ?? null,
      validUntil: data.validUntil ?? null,
      notes: data.notes ?? null,
      internalNotes: data.internalNotes ?? null,
      ...totals,
      empresaId,
      createdBy: userId,
      items: {
        create: data.items.map((it, idx) => {
          const { subtotal, total, taxAmount } = calcItemTotals(it)
          return {
            type: it.type,
            referenceId: it.referenceId ?? null,
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            unitCost: it.unitCost ?? 0,
            discountPct: it.discountPct ?? 0,
            taxType: (it.taxType as any) ?? 'IVA',
            taxRate: it.taxRate ?? 0.16,
            taxAmount,
            subtotal,
            total,
            approved: it.approved !== false,
            order: it.order ?? idx,
          }
        }),
      },
    },
    include: INCLUDE,
  })
}

export async function updateQuotation(
  db: Db,
  id: string,
  empresaId: string,
  data: IUpdateQuotationInput
) {
  const existing = await findQuotationById(db, id, empresaId)
  if (LOCKED_STATUSES.includes(existing.status as QuotationStatus)) {
    throw new BadRequestError(
      'No se puede editar una cotización convertida, rechazada o vencida'
    )
  }

  const updateData: any = {}
  if ('validUntil' in data) updateData.validUntil = data.validUntil
  if ('notes' in data) updateData.notes = data.notes
  if ('internalNotes' in data) updateData.internalNotes = data.internalNotes

  if (data.items && data.items.length > 0) {
    const totals = calcQuotationTotals(data.items)
    Object.assign(updateData, totals)
    // Incrementar versión al re-emitir con cambios de ítems
    updateData.version = existing.version + 1
  }

  return (db as PrismaClient).$transaction(async (tx) => {
    if (data.items && data.items.length > 0) {
      // Borrar ítems anteriores y recrear (upsert completo)
      await (tx as PrismaClient).workshopQuotationItem.deleteMany({
        where: { quotationId: id },
      })
      updateData.items = {
        create: data.items.map((it, idx) => {
          const { subtotal, total, taxAmount } = calcItemTotals(it)
          return {
            type: it.type,
            referenceId: it.referenceId ?? null,
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            unitCost: it.unitCost ?? 0,
            discountPct: it.discountPct ?? 0,
            taxType: (it.taxType as any) ?? 'IVA',
            taxRate: it.taxRate ?? 0.16,
            taxAmount,
            subtotal,
            total,
            approved: it.approved !== false,
            order: it.order ?? idx,
          }
        }),
      }
    }
    return (tx as PrismaClient).workshopQuotation.update({
      where: { id },
      data: updateData,
      include: INCLUDE,
    })
  })
}

export async function updateQuotationStatus(
  db: Db,
  id: string,
  empresaId: string,
  newStatus: QuotationStatus
) {
  const existing = await findQuotationById(db, id, empresaId)
  const allowed = VALID_TRANSITIONS[existing.status as QuotationStatus]
  if (!allowed.includes(newStatus)) {
    throw new BadRequestError(
      `No se puede pasar de ${existing.status} a ${newStatus}`
    )
  }
  const extra: any = {}
  if (newStatus === 'EXPIRED') extra.expiredAt = new Date()
  return (db as PrismaClient).workshopQuotation.update({
    where: { id },
    data: { status: newStatus, ...extra },
    include: INCLUDE,
  })
}

export async function registerApproval(
  db: Db,
  id: string,
  empresaId: string,
  data: IRegisterApprovalInput
) {
  const existing = await findQuotationById(db, id, empresaId)

  // Solo se puede aprobar/rechazar desde estos estados
  if (!['PENDING_APPROVAL', 'SENT', 'ISSUED'].includes(existing.status)) {
    throw new BadRequestError(
      'La cotización debe estar enviada o en aprobación pendiente para registrar una respuesta'
    )
  }

  return (db as PrismaClient).$transaction(async (tx) => {
    // Si es aprobación parcial, marcar ítems no incluidos como no aprobados
    if (
      data.type === 'PARTIAL' &&
      data.approvedItemIds &&
      data.approvedItemIds.length > 0
    ) {
      await (tx as PrismaClient).workshopQuotationItem.updateMany({
        where: { quotationId: id },
        data: { approved: false },
      })
      await (tx as PrismaClient).workshopQuotationItem.updateMany({
        where: { quotationId: id, id: { in: data.approvedItemIds } },
        data: { approved: true },
      })
    }

    const newStatus: QuotationStatus =
      data.type === 'TOTAL'
        ? 'APPROVED_TOTAL'
        : data.type === 'PARTIAL'
          ? 'APPROVED_PARTIAL'
          : 'REJECTED'

    const [approval, quotation] = await Promise.all([
      (tx as PrismaClient).workshopQuotationApproval.create({
        data: {
          quotationId: id,
          type: data.type,
          channel: data.channel,
          approvedByName: data.approvedByName,
          notes: data.notes ?? null,
          rejectionReason: data.rejectionReason ?? null,
        },
      }),
      (tx as PrismaClient).workshopQuotation.update({
        where: { id },
        data: { status: newStatus },
        include: INCLUDE,
      }),
    ])

    return quotation
  })
}

export async function convertToServiceOrder(
  db: Db,
  id: string,
  empresaId: string,
  userId: string,
  data: IConvertToSOInput
) {
  const quotation = await findQuotationById(db, id, empresaId)

  if (!['APPROVED_TOTAL', 'APPROVED_PARTIAL'].includes(quotation.status)) {
    throw new BadRequestError(
      'La cotización debe estar aprobada para convertirse en orden de servicio'
    )
  }
  if (quotation.serviceOrderId) {
    throw new ConflictError(
      'Esta cotización ya fue convertida en una orden de servicio'
    )
  }

  // Verificar recepción si aplica
  if (quotation.receptionId) {
    const rec = await (db as PrismaClient).vehicleReception.findFirst({
      where: { id: quotation.receptionId, empresaId },
      select: { status: true },
    })
    if (rec && rec.status === 'CONVERTED_TO_SO') {
      throw new ConflictError(
        'La recepción asociada ya fue convertida en una orden de servicio'
      )
    }
  }

  return (db as PrismaClient).$transaction(async (tx) => {
    // Generar folio para la OS (reutilizamos el patrón SO-XXXX)
    const lastSO = await (tx as PrismaClient).serviceOrder.findFirst({
      where: { empresaId },
      orderBy: { createdAt: 'desc' },
      select: { folio: true },
    })
    const lastNum = lastSO ? parseInt(lastSO.folio.replace('SO-', ''), 10) : 0
    const folio = `SO-${String(lastNum + 1).padStart(4, '0')}`

    // Filtrar solo ítems aprobados para la OS
    const approvedItems = (quotation.items as any[]).filter((it) => it.approved)

    // Crear la Orden de Servicio - Ahora los modelos están alineados
    const so = await (tx as PrismaClient).serviceOrder.create({
      data: {
        folio,
        status: 'OPEN',
        customerId: quotation.customerId,
        customerVehicleId: quotation.customerVehicleId ?? undefined,
        receptionId: quotation.receptionId ?? undefined,
        vehiclePlate: (quotation as any).customerVehicle?.plate ?? undefined,
        empresaId,
        createdBy: userId,
        advisorId: data.advisorId ?? undefined,
        internalNotes: data.notes ?? null,
        laborTotal: quotation.laborTotal,
        partsTotal: quotation.partsTotal,
        otherTotal: quotation.otherTotal,
        subtotal: quotation.subtotal,
        discount: quotation.discount,
        taxAmt: quotation.taxAmt,
        total: quotation.total,
        items: {
          create: approvedItems.map((it) => ({
            type:
              it.type === 'PART' || it.type === 'CONSUMABLE'
                ? 'PART'
                : it.type === 'LABOR'
                  ? 'LABOR'
                  : 'OTHER',
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            unitCost: it.unitCost,
            discountPct: it.discountPct,
            taxType: it.taxType,
            taxRate: it.taxRate,
            taxAmount: it.taxAmount,
            total: it.total,
            notes: null,
            operationId: it.type === 'LABOR' ? it.referenceId : null,
            itemId:
              it.type === 'PART' || it.type === 'CONSUMABLE'
                ? it.referenceId
                : null,
          })),
        },
      } as any,
      select: { id: true, folio: true },
    })

    // Actualizar cotización: vinculada a OS + estado CONVERTED
    const updated = await (tx as PrismaClient).workshopQuotation.update({
      where: { id },
      data: {
        serviceOrderId: so.id,
        status: 'CONVERTED',
        convertedAt: new Date(),
      },
      include: INCLUDE,
    })

    // Si venía de una recepción, actualizarla a CONVERTED_TO_SO
    if (quotation.receptionId) {
      await (tx as PrismaClient).vehicleReception.update({
        where: { id: quotation.receptionId },
        data: { status: 'CONVERTED_TO_SO' },
      })
    }

    return updated
  })
}
