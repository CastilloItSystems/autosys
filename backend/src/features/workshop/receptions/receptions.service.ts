// backend/src/features/workshop/receptions/receptions.service.ts
import type { PrismaClient } from '../../../generated/prisma/client.js'
import { NotFoundError, BadRequestError, ConflictError } from '../../../shared/utils/apiError.js'
import type { IReceptionFilters, ICreateReceptionInput, IUpdateReceptionInput } from './receptions.interface.js'

type Db = PrismaClient | Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

const INCLUDE = {
  customer: { select: { id: true, name: true, code: true, phone: true, mobile: true } },
  customerVehicle: { select: { id: true, plate: true, vehicleModel: { select: { name: true } }, brand: { select: { name: true } }, year: true, color: true } },
  appointment: { select: { id: true, folio: true, scheduledDate: true, status: true } },
  serviceOrder: { select: { id: true, folio: true, status: true } },
} as const

async function generateFolio(db: Db, empresaId: string): Promise<string> {
  const last = await (db as PrismaClient).vehicleReception.findFirst({
    where: { empresaId },
    orderBy: { createdAt: 'desc' },
    select: { folio: true },
  })
  const lastNum = last ? parseInt(last.folio.replace('REC-', ''), 10) : 0
  return `REC-${String(lastNum + 1).padStart(4, '0')}`
}

export async function findAllReceptions(db: Db, empresaId: string, filters: IReceptionFilters) {
  const { customerId, advisorId, appointmentId, dateFrom, dateTo, search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = filters
  const where: any = { empresaId }
  if (customerId) where.customerId = customerId
  if (advisorId) where.advisorId = advisorId
  if (appointmentId) where.appointmentId = appointmentId
  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) where.createdAt.gte = new Date(dateFrom)
    if (dateTo) where.createdAt.lte = new Date(dateTo)
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
    (db as PrismaClient).vehicleReception.findMany({ where, skip, take: limit, orderBy: { [sortBy]: sortOrder }, include: INCLUDE }),
    (db as PrismaClient).vehicleReception.count({ where }),
  ])
  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}

export async function findReceptionById(db: Db, id: string, empresaId: string) {
  const item = await (db as PrismaClient).vehicleReception.findFirst({ where: { id, empresaId }, include: INCLUDE })
  if (!item) throw new NotFoundError('Recepción no encontrada')
  return item
}

export async function createReception(db: Db, empresaId: string, userId: string, data: ICreateReceptionInput) {
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

  // Validar cita si se proveyó
  if (data.appointmentId) {
    const apt = await (db as PrismaClient).serviceAppointment.findFirst({ where: { id: data.appointmentId, empresaId } })
    if (!apt) throw new NotFoundError('Cita no encontrada')
    if (['COMPLETED', 'CANCELLED'].includes(apt.status)) {
      throw new BadRequestError('La cita ya está completada o cancelada')
    }
    // Marcar cita como ARRIVED
    await (db as PrismaClient).serviceAppointment.update({ where: { id: data.appointmentId }, data: { status: 'ARRIVED' } })
  }

  const folio = await generateFolio(db, empresaId)
  return (db as PrismaClient).vehicleReception.create({
    data: {
      folio,
      empresaId,
      customerId: data.customerId,
      customerVehicleId: data.customerVehicleId ?? null,
      vehiclePlate: vehiclePlate ?? null,
      vehicleDesc: vehicleDesc ?? null,
      mileageIn: data.mileageIn ?? null,
      fuelLevel: data.fuelLevel ?? null,
      accessories: data.accessories ?? [],
      hasPreExistingDamage: data.hasPreExistingDamage ?? false,
      damageNotes: data.damageNotes ?? null,
      clientDescription: data.clientDescription ?? null,
      authorizationName: data.authorizationName ?? null,
      authorizationPhone: data.authorizationPhone ?? null,
      estimatedDelivery: data.estimatedDelivery ?? null,
      advisorId: data.advisorId ?? null,
      appointmentId: data.appointmentId ?? null,
      createdBy: userId,
    },
    include: INCLUDE,
  })
}

export async function updateReception(db: Db, id: string, empresaId: string, data: IUpdateReceptionInput) {
  const existing = await findReceptionById(db, id, empresaId)
  // No editar si ya tiene OT cerrada
  if (existing.serviceOrder && ['CLOSED', 'CANCELLED'].includes((existing.serviceOrder as any).status)) {
    throw new BadRequestError('No se puede editar: la recepción tiene una orden de trabajo cerrada o cancelada')
  }
  return (db as PrismaClient).vehicleReception.update({ where: { id }, data, include: INCLUDE })
}

export async function deleteReception(db: Db, id: string, empresaId: string) {
  const existing = await findReceptionById(db, id, empresaId)
  if (existing.serviceOrder) {
    throw new ConflictError('No se puede eliminar: la recepción tiene una orden de trabajo asociada')
  }
  await (db as PrismaClient).vehicleReception.delete({ where: { id } })
}
