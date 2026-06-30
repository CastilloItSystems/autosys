// backend/src/features/workshop/workshopWarranties/workshopWarranties.service.ts
import type { PrismaClient } from '../../../generated/prisma/client.js'
import { NotFoundError, BadRequestError, ConflictError } from '../../../shared/utils/apiError.js'
import { assertTransition } from '../../../shared/utils/stateMachine.js'
import type {
  IWarrantyFilters, ICreateWarrantyInput, IUpdateWarrantyInput, WarrantyStatus,
} from './workshopWarranties.interface.js'

type Db = PrismaClient | Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

const INCLUDE = {
  originalOrder: { select: { id: true, folio: true, status: true, receivedAt: true } },
  reworkOrder: { select: { id: true, folio: true, status: true } },
  customer: { select: { id: true, name: true, code: true, phone: true } },
  customerVehicle: { select: { id: true, plate: true } },
} as const

const VALID_TRANSITIONS: Record<WarrantyStatus, WarrantyStatus[]> = {
  OPEN:        ['IN_PROGRESS', 'REJECTED', 'CLOSED'],
  IN_PROGRESS: ['RESOLVED', 'REJECTED'],
  RESOLVED:    ['CLOSED'],
  REJECTED:    ['CLOSED'],
  CLOSED:      [],
}

async function generateWarrantyNumber(db: Db, empresaId: string): Promise<string> {
  const last = await (db as PrismaClient).workshopWarranty.findFirst({
    where: { empresaId },
    orderBy: { createdAt: 'desc' },
    select: { warrantyNumber: true },
  })
  const lastNum = last ? parseInt(last.warrantyNumber.replace('WRN-', ''), 10) : 0
  return `WRN-${String(lastNum + 1).padStart(4, '0')}`
}

export async function findAllWarranties(db: Db, empresaId: string, filters: IWarrantyFilters) {
  const { status, type, customerId, technicianId, search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = filters
  const where: any = { empresaId }
  if (status) where.status = status
  if (type) where.type = type
  if (customerId) where.customerId = customerId
  if (technicianId) where.technicianId = technicianId
  if (search) {
    where.OR = [
      { warrantyNumber: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { customer: { name: { contains: search, mode: 'insensitive' } } },
    ]
  }
  const skip = (page - 1) * limit
  const [data, total] = await Promise.all([
    (db as PrismaClient).workshopWarranty.findMany({ where, skip, take: limit, orderBy: { [sortBy]: sortOrder }, include: INCLUDE }),
    (db as PrismaClient).workshopWarranty.count({ where }),
  ])
  return { data, page, limit, total }
}

export async function findWarrantyById(db: Db, id: string, empresaId: string) {
  const item = await (db as PrismaClient).workshopWarranty.findFirst({ where: { id, empresaId }, include: INCLUDE })
  if (!item) throw new NotFoundError('Garantía no encontrada')
  return item
}

export async function createWarranty(db: Db, empresaId: string, userId: string, data: ICreateWarrantyInput) {
  // Verificar OT original
  const so = await (db as PrismaClient).serviceOrder.findFirst({
    where: { id: data.originalOrderId, empresaId },
    select: { id: true, status: true, customerId: true, deliveredAt: true },
  })
  if (!so) throw new NotFoundError('Orden de trabajo original no encontrada')
  if (!['DELIVERED', 'INVOICED', 'CLOSED'].includes(so.status)) {
    throw new BadRequestError('Solo se puede crear una garantía sobre una orden entregada, facturada o cerrada')
  }

  // El cliente de la garantía debe coincidir con el de la OT original
  if (so.customerId !== data.customerId) {
    throw new BadRequestError('La garantía y la orden original deben pertenecer al mismo cliente')
  }

  // Verificar cliente
  const customer = await (db as PrismaClient).customer.findFirst({ where: { id: data.customerId, empresaId } })
  if (!customer) throw new NotFoundError('Cliente no encontrado')

  // Validación de vigencia: la garantía no puede crearse fuera de su período de
  // vigencia. Si el cliente indica fecha de vencimiento (expiresAt), esta no
  // puede ser anterior a la fecha actual. Adicionalmente, si la OT registra
  // fecha de entrega (deliveredAt), no puede ser posterior a hoy.
  const now = new Date()
  if (data.expiresAt && new Date(data.expiresAt).getTime() < now.getTime()) {
    throw new BadRequestError('No se puede crear una garantía ya vencida (fecha de vencimiento anterior a hoy)')
  }
  if (so.deliveredAt && new Date(so.deliveredAt).getTime() > now.getTime()) {
    throw new BadRequestError('La fecha de entrega de la orden original es inválida (posterior a la fecha actual)')
  }

  const warrantyNumber = await generateWarrantyNumber(db, empresaId)
  return (db as PrismaClient).workshopWarranty.create({
    data: {
      warrantyNumber,
      type: data.type,
      status: 'OPEN',
      originalOrderId: data.originalOrderId,
      customerId: data.customerId,
      customerVehicleId: data.customerVehicleId ?? null,
      description: data.description,
      technicianId: data.technicianId ?? null,
      expiresAt: data.expiresAt ?? null,
      empresaId,
      createdBy: userId,
    },
    include: INCLUDE,
  })
}

export async function updateWarranty(db: Db, id: string, empresaId: string, data: IUpdateWarrantyInput) {
  const existing = await findWarrantyById(db, id, empresaId)
  if (['CLOSED', 'RESOLVED'].includes(existing.status)) {
    throw new BadRequestError('No se puede editar una garantía cerrada o resuelta')
  }
  // Si se vincula una OT de retrabajo, verificar que exista
  if (data.reworkOrderId) {
    const rework = await (db as PrismaClient).serviceOrder.findFirst({ where: { id: data.reworkOrderId, empresaId } })
    if (!rework) throw new NotFoundError('Orden de retrabajo no encontrada')
  }
  // Construir updateData explícito con solo los campos permitidos para evitar
  // mass-assignment (no se confía en el payload crudo del cliente).
  const updateData: any = {}
  if ('rootCause' in data) updateData.rootCause = data.rootCause
  if ('resolution' in data) updateData.resolution = data.resolution
  if ('technicianId' in data) updateData.technicianId = data.technicianId
  if ('reworkOrderId' in data) updateData.reworkOrderId = data.reworkOrderId
  return (db as PrismaClient).workshopWarranty.update({ where: { id }, data: updateData, include: INCLUDE })
}

export async function updateWarrantyStatus(db: Db, id: string, empresaId: string, newStatus: WarrantyStatus) {
  const existing = await findWarrantyById(db, id, empresaId)
  assertTransition(VALID_TRANSITIONS, existing.status as WarrantyStatus, newStatus, {
    entity: 'Garantía',
  })
  const extra: any = {}
  if (newStatus === 'RESOLVED') extra.resolvedAt = new Date()
  return (db as PrismaClient).workshopWarranty.update({ where: { id }, data: { status: newStatus, ...extra }, include: INCLUDE })
}
