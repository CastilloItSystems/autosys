// backend/src/features/workshop/workshopShifts/workshopShifts.service.ts
import type { PrismaClient } from '../../../generated/prisma/client.js'
import { NotFoundError, ConflictError, BadRequestError } from '../../../shared/utils/apiError.js'

type Db = PrismaClient | Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

// workDays: array of 0-6 (0=Sun, 1=Mon ... 6=Sat)
function validateWorkDays(workDays: number[]) {
  if (!Array.isArray(workDays) || workDays.length === 0)
    throw new BadRequestError('workDays debe ser un arreglo con al menos un día')
  if (workDays.some(d => !Number.isInteger(d) || d < 0 || d > 6))
    throw new BadRequestError('workDays debe contener valores entre 0 (domingo) y 6 (sábado)')
}

// Validate HH:MM format
function validateTime(value: string, field: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) throw new BadRequestError(`${field} debe estar en formato HH:MM`)
}

export interface IShiftFilters {
  search?: string
  isActive?: boolean
  page?: number
  limit?: number
}

export interface ICreateShiftInput {
  code: string
  name: string
  startTime: string
  endTime: string
  workDays?: number[]
  createdBy: string
}

export interface IUpdateShiftInput {
  code?: string
  name?: string
  startTime?: string
  endTime?: string
  workDays?: number[]
  isActive?: boolean
}

export async function findAllShifts(db: Db, empresaId: string, filters: IShiftFilters = {}) {
  const { search, isActive, page = 1, limit = 20 } = filters ?? {}
  const where: any = { empresaId }
  if (isActive !== undefined) where.isActive = isActive
  if (search) {
    where.OR = [
      { code: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
    ]
  }
  const skip = (page - 1) * limit
  const [data, total] = await Promise.all([
    (db as PrismaClient).workshopShift.findMany({ where, skip, take: limit, orderBy: { startTime: 'asc' } }),
    (db as PrismaClient).workshopShift.count({ where }),
  ])
  return { data, page, limit, total }
}

export async function findShiftById(db: Db, id: string, empresaId: string) {
  const item = await (db as PrismaClient).workshopShift.findFirst({ where: { id, empresaId } })
  if (!item) throw new NotFoundError('Turno no encontrado')
  return item
}

export async function createShift(db: Db, empresaId: string, data: ICreateShiftInput) {
  const exists = await (db as PrismaClient).workshopShift.findFirst({ where: { empresaId, code: data.code } })
  if (exists) throw new ConflictError(`Ya existe un turno con el código ${data.code}`)
  validateTime(data.startTime, 'startTime')
  validateTime(data.endTime, 'endTime')
  const workDays = data.workDays ?? [1, 2, 3, 4, 5]
  validateWorkDays(workDays)
  return (db as PrismaClient).workshopShift.create({
    data: { code: data.code, name: data.name, startTime: data.startTime, endTime: data.endTime, workDays, createdBy: data.createdBy, empresaId },
  })
}

export async function updateShift(db: Db, id: string, empresaId: string, data: IUpdateShiftInput) {
  await findShiftById(db, id, empresaId)
  if (data.code) {
    const conflict = await (db as PrismaClient).workshopShift.findFirst({ where: { empresaId, code: data.code, NOT: { id } } })
    if (conflict) throw new ConflictError(`Ya existe un turno con el código ${data.code}`)
  }
  if (data.startTime) validateTime(data.startTime, 'startTime')
  if (data.endTime) validateTime(data.endTime, 'endTime')
  if (data.workDays) validateWorkDays(data.workDays)
  return (db as PrismaClient).workshopShift.update({ where: { id }, data })
}

export async function toggleShiftActive(db: Db, id: string, empresaId: string) {
  const item = await findShiftById(db, id, empresaId)
  return (db as PrismaClient).workshopShift.update({ where: { id }, data: { isActive: !item.isActive } })
}
