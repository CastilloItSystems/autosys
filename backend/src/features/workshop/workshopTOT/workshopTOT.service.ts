// backend/src/features/workshop/workshopTOT/workshopTOT.service.ts
import type { PrismaClient } from '../../../generated/prisma/client.js'
import { NotFoundError, ConflictError, BadRequestError } from '../../../shared/utils/apiError.js'
import type { ICreateTOT, IUpdateTOT, ITOTFilters, TOTStatus, IAddTOTDocument } from './workshopTOT.interface.js'

type Db = PrismaClient | Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

const VALID_TRANSITIONS: Record<TOTStatus, TOTStatus[]> = {
  REQUESTED:   ['APPROVED', 'CANCELLED'],
  APPROVED:    ['DEPARTED', 'CANCELLED'],
  DEPARTED:    ['IN_PROGRESS', 'RETURNED'],
  IN_PROGRESS: ['RETURNED', 'CANCELLED'],
  RETURNED:    ['INVOICED'],
  INVOICED:    [],
  CANCELLED:   [],
}

const INCLUDE = {
  supplier: { select: { id: true, code: true, name: true, specialty: true, phone: true, email: true } },
  serviceOrder: { select: { id: true, folio: true, status: true } },
  documents: { orderBy: { createdAt: 'asc' as const } },
}

export async function findAllTOTs(db: Db, empresaId: string, filters: ITOTFilters) {
  const { status, serviceOrderId, supplierId, search, page = 1, limit = 50 } = filters
  const where: any = { empresaId }
  if (status) where.status = status
  if (serviceOrderId) where.serviceOrderId = serviceOrderId
  if (supplierId) where.supplierId = supplierId
  if (search) {
    where.OR = [
      { totNumber: { contains: search, mode: 'insensitive' } },
      { partDescription: { contains: search, mode: 'insensitive' } },
      { requestedWork: { contains: search, mode: 'insensitive' } },
      { providerName: { contains: search, mode: 'insensitive' } },
    ]
  }
  const skip = (page - 1) * limit
  const [data, total] = await Promise.all([
    (db as PrismaClient).workshopTOT.findMany({
      where, skip, take: limit,
      orderBy: { createdAt: 'desc' },
      include: INCLUDE,
    }),
    (db as PrismaClient).workshopTOT.count({ where }),
  ])
  return { data, page, limit, total }
}

export async function findTOTById(db: Db, id: string, empresaId: string) {
  const item = await (db as PrismaClient).workshopTOT.findFirst({
    where: { id, empresaId },
    include: INCLUDE,
  })
  if (!item) throw new NotFoundError('T.O.T. no encontrado')
  return item
}

export async function createTOT(db: Db, empresaId: string, userId: string, data: ICreateTOT) {
  const so = await (db as PrismaClient).serviceOrder.findFirst({ where: { id: data.serviceOrderId, empresaId } })
  if (!so) throw new NotFoundError('Orden de servicio no encontrada')

  if (data.supplierId) {
    const sup = await (db as PrismaClient).supplier.findFirst({ where: { id: data.supplierId, empresaId } })
    if (!sup) throw new NotFoundError('Proveedor no encontrado')
  }

  const last = await (db as PrismaClient).workshopTOT.findFirst({
    where: { empresaId },
    orderBy: { totNumber: 'desc' },
  })
  let nextNum = 1
  if (last?.totNumber) {
    const match = last.totNumber.match(/(\d+)$/)
    if (match) nextNum = parseInt(match[1], 10) + 1
  }
  const totNumber = `TOT-${String(nextNum).padStart(4, '0')}`

  return (db as PrismaClient).workshopTOT.create({
    data: {
      totNumber,
      serviceOrderId: data.serviceOrderId,
      supplierId: data.supplierId || null,
      providerName: data.providerName || null,
      partDescription: data.partDescription,
      partSerial: data.partSerial || null,
      photoUrls: data.photoUrls ?? undefined,
      requestedWork: data.requestedWork,
      technicalInstruction: data.technicalInstruction || null,
      estimatedReturnAt: data.estimatedReturnAt || null,
      providerQuote: data.providerQuote ?? null,
      notes: data.notes || null,
      empresaId,
      createdBy: userId,
    },
    include: INCLUDE,
  })
}

export async function updateTOT(db: Db, id: string, empresaId: string, data: IUpdateTOT) {
  const item = await findTOTById(db, id, empresaId)
  if (item.status === 'INVOICED' || item.status === 'CANCELLED') {
    throw new BadRequestError('No se puede editar un T.O.T. en estado INVOICED o CANCELLED')
  }
  if (data.supplierId) {
    const sup = await (db as PrismaClient).supplier.findFirst({ where: { id: data.supplierId, empresaId } })
    if (!sup) throw new NotFoundError('Proveedor no encontrado')
  }
  return (db as PrismaClient).workshopTOT.update({
    where: { id },
    data: {
      ...(data.supplierId !== undefined && { supplierId: data.supplierId }),
      ...(data.providerName !== undefined && { providerName: data.providerName }),
      ...(data.partDescription !== undefined && { partDescription: data.partDescription }),
      ...(data.partSerial !== undefined && { partSerial: data.partSerial }),
      ...(data.photoUrls !== undefined && { photoUrls: data.photoUrls }),
      ...(data.requestedWork !== undefined && { requestedWork: data.requestedWork }),
      ...(data.technicalInstruction !== undefined && { technicalInstruction: data.technicalInstruction }),
      ...(data.approvedById !== undefined && { approvedById: data.approvedById }),
      ...(data.departureRef !== undefined && { departureRef: data.departureRef }),
      ...(data.departedAt !== undefined && { departedAt: data.departedAt }),
      ...(data.estimatedReturnAt !== undefined && { estimatedReturnAt: data.estimatedReturnAt }),
      ...(data.returnedAt !== undefined && { returnedAt: data.returnedAt }),
      ...(data.providerQuote !== undefined && { providerQuote: data.providerQuote }),
      ...(data.finalCost !== undefined && { finalCost: data.finalCost }),
      ...(data.providerInvoiceRef !== undefined && { providerInvoiceRef: data.providerInvoiceRef }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
    include: INCLUDE,
  })
}

export async function updateTOTStatus(db: Db, id: string, empresaId: string, newStatus: TOTStatus) {
  const item = await findTOTById(db, id, empresaId)
  const allowed = VALID_TRANSITIONS[item.status as TOTStatus]
  if (!allowed.includes(newStatus)) {
    throw new BadRequestError(`No se puede pasar de ${item.status} a ${newStatus}`)
  }

  const extraData: any = {}
  if (newStatus === 'DEPARTED' && !item.departedAt) extraData.departedAt = new Date()
  if (newStatus === 'RETURNED' && !item.returnedAt) extraData.returnedAt = new Date()

  // When INVOICED: add finalCost (or providerQuote) to the SO's otherTotal
  if (newStatus === 'INVOICED') {
    const cost = Number(item.finalCost ?? item.providerQuote ?? 0)
    if (cost > 0) {
      return (db as PrismaClient).$transaction(async (tx) => {
        const updated = await tx.workshopTOT.update({
          where: { id },
          data: { status: newStatus },
          include: INCLUDE,
        })

        const otherTOTs = await tx.workshopTOT.aggregate({
          where: { serviceOrderId: item.serviceOrderId, status: 'INVOICED', id: { not: id } },
          _sum: { finalCost: true, providerQuote: true },
        })
        const prevCost = Number(otherTOTs._sum.finalCost ?? otherTOTs._sum.providerQuote ?? 0)

        const so = await tx.serviceOrder.findFirst({
          where: { id: item.serviceOrderId },
          select: { laborTotal: true, partsTotal: true, taxAmt: true },
        })
        if (so) {
          const newOtherTotal = prevCost + cost
          const newSubtotal = Number(so.laborTotal) + Number(so.partsTotal) + newOtherTotal
          const taxAmt = Number(so.taxAmt)
          await tx.serviceOrder.update({
            where: { id: item.serviceOrderId },
            data: {
              otherTotal: newOtherTotal.toString(),
              subtotal: newSubtotal.toString(),
              total: (newSubtotal + taxAmt).toString(),
            },
          })
        }

        return updated
      })
    }
  }

  return (db as PrismaClient).workshopTOT.update({
    where: { id },
    data: { status: newStatus, ...extraData },
    include: INCLUDE,
  })
}

export async function addDocument(db: Db, id: string, empresaId: string, userId: string, data: IAddTOTDocument) {
  await findTOTById(db, id, empresaId)
  await (db as PrismaClient).workshopTOTDocument.create({
    data: {
      totId: id,
      type: data.type as any,
      url: data.url,
      description: data.description || null,
      uploadedBy: userId,
    },
  })
  return findTOTById(db, id, empresaId)
}

export async function removeDocument(db: Db, totId: string, docId: string, empresaId: string) {
  await findTOTById(db, totId, empresaId)
  const doc = await (db as PrismaClient).workshopTOTDocument.findFirst({ where: { id: docId, totId } })
  if (!doc) throw new NotFoundError('Documento no encontrado')
  await (db as PrismaClient).workshopTOTDocument.delete({ where: { id: docId } })
}

export async function removeTOT(db: Db, id: string, empresaId: string) {
  const item = await findTOTById(db, id, empresaId)
  if (!['REQUESTED', 'CANCELLED'].includes(item.status)) {
    throw new ConflictError('Solo se pueden eliminar T.O.T. en estado REQUESTED o CANCELLED')
  }
  await (db as PrismaClient).workshopTOT.delete({ where: { id } })
}
