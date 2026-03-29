// backend/src/features/workshop/appointments/appointments.service.ts
import type { PrismaClient } from '../../../generated/prisma/client.js'
import { NotFoundError, BadRequestError, ConflictError } from '../../../shared/utils/apiError.js'
import type {
  IAppointmentFilters,
  ICreateAppointmentInput,
  IUpdateAppointmentInput,
  AppointmentStatus,
} from './appointments.interface.js'

type Db = PrismaClient | Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

const VALID_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  SCHEDULED:  ['CONFIRMED', 'ARRIVED', 'NO_SHOW', 'CANCELLED'],
  CONFIRMED:  ['ARRIVED', 'NO_SHOW', 'CANCELLED'],
  ARRIVED:    ['COMPLETED', 'CANCELLED'],
  COMPLETED:  [],
  NO_SHOW:    ['SCHEDULED'], // permite re-agendar
  CANCELLED:  [],
}

const INCLUDE = {
  customer: { select: { id: true, name: true, code: true, phone: true, mobile: true } },
  customerVehicle: { select: { id: true, plate: true, vehicleModel: { select: { name: true } }, brand: { select: { name: true } }, year: true, color: true } },
  serviceType: { select: { id: true, code: true, name: true } },
} as const

async function generateFolio(db: Db, empresaId: string): Promise<string> {
  const last = await (db as PrismaClient).serviceAppointment.findFirst({
    where: { empresaId },
    orderBy: { createdAt: 'desc' },
    select: { folio: true },
  })
  const lastNum = last ? parseInt(last.folio.replace('APT-', ''), 10) : 0
  return `APT-${String(lastNum + 1).padStart(4, '0')}`
}

export async function findAllAppointments(db: Db, empresaId: string, filters: IAppointmentFilters) {
  const { status, customerId, assignedAdvisorId, dateFrom, dateTo, search, page = 1, limit = 20, sortBy = 'scheduledDate', sortOrder = 'asc' } = filters
  const where: any = { empresaId }
  if (status) where.status = status
  if (customerId) where.customerId = customerId
  if (assignedAdvisorId) where.assignedAdvisorId = assignedAdvisorId
  if (dateFrom || dateTo) {
    where.scheduledDate = {}
    if (dateFrom) where.scheduledDate.gte = new Date(dateFrom)
    if (dateTo) where.scheduledDate.lte = new Date(dateTo)
  }
  if (search) {
    where.OR = [
      { folio: { contains: search, mode: 'insensitive' } },
      { vehiclePlate: { contains: search, mode: 'insensitive' } },
      { customer: { name: { contains: search, mode: 'insensitive' } } },
    ]
  }
  const skip = (page - 1) * limit
  const [data, total] = await Promise.all([
    (db as PrismaClient).serviceAppointment.findMany({ where, skip, take: limit, orderBy: { [sortBy]: sortOrder }, include: INCLUDE }),
    (db as PrismaClient).serviceAppointment.count({ where }),
  ])
  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}

export async function findAppointmentById(db: Db, id: string, empresaId: string) {
  const item = await (db as PrismaClient).serviceAppointment.findFirst({ where: { id, empresaId }, include: INCLUDE })
  if (!item) throw new NotFoundError('Cita no encontrada')
  return item
}

export async function createAppointment(db: Db, empresaId: string, userId: string, data: ICreateAppointmentInput) {
  const customer = await (db as PrismaClient).customer.findFirst({ where: { id: data.customerId, empresaId } })
  if (!customer) throw new NotFoundError('Cliente no encontrado')

  let vehiclePlate = data.vehiclePlate
  let vehicleDesc = data.vehicleDesc
  if (data.customerVehicleId) {
    const v = await (db as PrismaClient).customerVehicle.findFirst({
      where: { id: data.customerVehicleId, customerId: data.customerId },
      select: { plate: true, vehicleModel: { select: { name: true } }, brand: { select: { name: true } }, year: true, color: true },
    })
    if (!v) throw new NotFoundError('Vehículo no encontrado para este cliente')
    vehiclePlate = vehiclePlate ?? v.plate
    vehicleDesc = vehicleDesc ?? [v.brand?.name, v.vehicleModel?.name, v.year, v.color].filter(Boolean).join(' ')
  }

  const folio = await generateFolio(db, empresaId)
  return (db as PrismaClient).serviceAppointment.create({
    data: {
      folio,
      empresaId,
      customerId: data.customerId,
      customerVehicleId: data.customerVehicleId ?? null,
      vehiclePlate: vehiclePlate ?? null,
      vehicleDesc: vehicleDesc ?? null,
      serviceTypeId: data.serviceTypeId ?? null,
      scheduledDate: data.scheduledDate,
      estimatedMinutes: data.estimatedMinutes ?? null,
      assignedAdvisorId: data.assignedAdvisorId ?? null,
      clientNotes: data.clientNotes ?? null,
      internalNotes: data.internalNotes ?? null,
      createdBy: userId,
    },
    include: INCLUDE,
  })
}

export async function updateAppointment(db: Db, id: string, empresaId: string, data: IUpdateAppointmentInput) {
  const existing = await findAppointmentById(db, id, empresaId)
  if (['COMPLETED', 'CANCELLED'].includes(existing.status)) {
    throw new BadRequestError('No se puede editar una cita completada o cancelada')
  }
  return (db as PrismaClient).serviceAppointment.update({ where: { id }, data, include: INCLUDE })
}

export async function updateAppointmentStatus(db: Db, id: string, empresaId: string, newStatus: AppointmentStatus) {
  const existing = await findAppointmentById(db, id, empresaId)
  const allowed = VALID_TRANSITIONS[existing.status as AppointmentStatus]
  if (!allowed.includes(newStatus)) {
    throw new BadRequestError(`No se puede pasar de ${existing.status} a ${newStatus}`)
  }
  return (db as PrismaClient).serviceAppointment.update({ where: { id }, data: { status: newStatus }, include: INCLUDE })
}

export async function deleteAppointment(db: Db, id: string, empresaId: string) {
  const existing = await findAppointmentById(db, id, empresaId)
  if (!['SCHEDULED', 'CANCELLED'].includes(existing.status)) {
    throw new BadRequestError('Solo se pueden eliminar citas en estado SCHEDULED o CANCELLED')
  }
  // Verificar que no tenga OT asociada
  if (existing.serviceOrder) throw new ConflictError('No se puede eliminar: la cita tiene una orden de trabajo asociada')
  await (db as PrismaClient).serviceAppointment.delete({ where: { id } })
}
