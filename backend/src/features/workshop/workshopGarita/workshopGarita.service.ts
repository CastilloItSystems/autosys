// backend/src/features/workshop/workshopGarita/workshopGarita.service.ts
import type { PrismaClient } from '../../../generated/prisma/client.js'
import { NotFoundError, BadRequestError } from '../../../shared/utils/apiError.js'
import type { ICreateGaritaEvent, IUpdateGaritaEvent, IGaritaFilters, GaritaEventStatus, GaritaEventType } from './workshopGarita.interface.js'
import { GARITA_VALID_TRANSITIONS } from './workshopGarita.validation.js'

type Db = PrismaClient | Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

// Types that require an exit pass reference before AUTHORIZED
const REQUIRES_EXIT_PASS: GaritaEventType[] = ['VEHICLE_OUT', 'PART_OUT', 'ROAD_TEST_OUT']

const INCLUDE = {
  serviceOrder: { select: { id: true, folio: true, status: true, vehiclePlate: true, vehicleDesc: true } },
  tot: { select: { id: true, totNumber: true, status: true, partDescription: true } },
}

export async function findAllGaritaEvents(db: Db, empresaId: string, filters: IGaritaFilters) {
  const { type, status, serviceOrderId, totId, plateNumber, search, dateFrom, dateTo, page = 1, limit = 50 } = filters
  const where: any = { empresaId }
  if (type) where.type = type
  if (status) where.status = status
  if (serviceOrderId) where.serviceOrderId = serviceOrderId
  if (totId) where.totId = totId
  if (plateNumber) where.plateNumber = { contains: plateNumber, mode: 'insensitive' }
  if (dateFrom || dateTo) {
    where.eventAt = {}
    if (dateFrom) where.eventAt.gte = new Date(dateFrom)
    if (dateTo) where.eventAt.lte = new Date(dateTo)
  }
  if (search) {
    where.OR = [
      { plateNumber: { contains: search, mode: 'insensitive' } },
      { driverName: { contains: search, mode: 'insensitive' } },
      { vehicleDesc: { contains: search, mode: 'insensitive' } },
      { exitPassRef: { contains: search, mode: 'insensitive' } },
    ]
  }
  const skip = (page - 1) * limit
  const [data, total] = await Promise.all([
    (db as PrismaClient).workshopGarita.findMany({
      where, skip, take: limit,
      orderBy: { eventAt: 'desc' },
      include: INCLUDE,
    }),
    (db as PrismaClient).workshopGarita.count({ where }),
  ])
  return { data, page, limit, total }
}

export async function findGaritaEventById(db: Db, id: string, empresaId: string) {
  const item = await (db as PrismaClient).workshopGarita.findFirst({
    where: { id, empresaId },
    include: INCLUDE,
  })
  if (!item) throw new NotFoundError('Registro de garita no encontrado')
  return item
}

export async function createGaritaEvent(db: Db, empresaId: string, userId: string, data: ICreateGaritaEvent) {
  if (data.serviceOrderId) {
    const so = await (db as PrismaClient).serviceOrder.findFirst({ where: { id: data.serviceOrderId, empresaId } })
    if (!so) throw new NotFoundError('Orden de servicio no encontrada')
  }
  if (data.totId) {
    const tot = await (db as PrismaClient).workshopTOT.findFirst({ where: { id: data.totId, empresaId } })
    if (!tot) throw new NotFoundError('T.O.T. no encontrado')
  }

  return (db as PrismaClient).workshopGarita.create({
    data: {
      type: data.type as any,
      serviceOrderId: data.serviceOrderId || null,
      totId: data.totId || null,
      plateNumber: data.plateNumber || null,
      vehicleDesc: data.vehicleDesc || null,
      serialMotor: data.serialMotor || null,
      serialBody: data.serialBody || null,
      kmIn: data.kmIn ?? null,
      driverName: data.driverName || null,
      driverId: data.driverId || null,
      exitPassRef: data.exitPassRef || null,
      photoUrls: data.photoUrls ?? undefined,
      notes: data.notes || null,
      eventAt: data.eventAt ?? new Date(),
      empresaId,
      createdBy: userId,
    },
    include: INCLUDE,
  })
}

export async function updateGaritaEvent(db: Db, id: string, empresaId: string, data: IUpdateGaritaEvent) {
  const item = await findGaritaEventById(db, id, empresaId)
  if (['COMPLETED', 'CANCELLED'].includes(item.status)) {
    throw new BadRequestError('No se puede editar un registro en estado COMPLETED o CANCELLED')
  }
  return (db as PrismaClient).workshopGarita.update({
    where: { id },
    data: {
      ...(data.plateNumber !== undefined && { plateNumber: data.plateNumber }),
      ...(data.vehicleDesc !== undefined && { vehicleDesc: data.vehicleDesc }),
      ...(data.serialMotor !== undefined && { serialMotor: data.serialMotor }),
      ...(data.serialBody !== undefined && { serialBody: data.serialBody }),
      ...(data.kmIn !== undefined && { kmIn: data.kmIn }),
      ...(data.kmOut !== undefined && { kmOut: data.kmOut }),
      ...(data.driverName !== undefined && { driverName: data.driverName }),
      ...(data.driverId !== undefined && { driverId: data.driverId }),
      ...(data.exitPassRef !== undefined && { exitPassRef: data.exitPassRef }),
      ...(data.authorizedById !== undefined && { authorizedById: data.authorizedById }),
      ...(data.authorizedAt !== undefined && { authorizedAt: data.authorizedAt }),
      ...(data.photoUrls !== undefined && { photoUrls: data.photoUrls }),
      ...(data.hasIrregularity !== undefined && { hasIrregularity: data.hasIrregularity }),
      ...(data.irregularityNotes !== undefined && { irregularityNotes: data.irregularityNotes }),
      ...(data.completedAt !== undefined && { completedAt: data.completedAt }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
    include: INCLUDE,
  })
}

export async function updateGaritaStatus(
  db: Db, id: string, empresaId: string, userId: string,
  newStatus: GaritaEventStatus, extra?: { kmOut?: number; exitPassRef?: string; irregularityNotes?: string; notes?: string }
) {
  const item = await findGaritaEventById(db, id, empresaId)
  const allowed = GARITA_VALID_TRANSITIONS[item.status] ?? []
  if (!allowed.includes(newStatus)) {
    throw new BadRequestError(`No se puede pasar de ${item.status} a ${newStatus}`)
  }

  // Salidas requieren pase de salida
  if (newStatus === 'AUTHORIZED' && REQUIRES_EXIT_PASS.includes(item.type as GaritaEventType)) {
    const passRef = extra?.exitPassRef ?? item.exitPassRef
    if (!passRef) throw new BadRequestError('Se requiere referencia del pase de salida para autorizar este tipo de evento')
  }

  const extraData: any = {}
  if (newStatus === 'AUTHORIZED') {
    extraData.authorizedById = userId
    extraData.authorizedAt = new Date()
    if (extra?.exitPassRef) extraData.exitPassRef = extra.exitPassRef
  }
  if (newStatus === 'COMPLETED') {
    extraData.completedAt = new Date()
    if (extra?.kmOut) extraData.kmOut = extra.kmOut
  }
  if (newStatus === 'FLAGGED') {
    extraData.hasIrregularity = true
    if (extra?.irregularityNotes) extraData.irregularityNotes = extra.irregularityNotes
  }
  if (extra?.notes) extraData.notes = extra.notes

  return (db as PrismaClient).workshopGarita.update({
    where: { id },
    data: { status: newStatus, ...extraData },
    include: INCLUDE,
  })
}

export async function removeGaritaEvent(db: Db, id: string, empresaId: string) {
  const item = await findGaritaEventById(db, id, empresaId)
  if (!['PENDING', 'CANCELLED'].includes(item.status)) {
    throw new BadRequestError('Solo se pueden eliminar registros en estado PENDING o CANCELLED')
  }
  await (db as PrismaClient).workshopGarita.delete({ where: { id } })
}
