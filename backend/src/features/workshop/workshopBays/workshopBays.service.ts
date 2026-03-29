// backend/src/features/workshop/workshopBays/workshopBays.service.ts
import type { PrismaClient } from '../../../generated/prisma/client.js'
import { NotFoundError, ConflictError } from '../../../shared/utils/apiError.js'
import type { IWorkshopBayFilters, ICreateWorkshopBayInput, IUpdateWorkshopBayInput } from './workshopBays.interface.js'

type Db = PrismaClient | Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

export async function findAllWorkshopBays(db: Db, empresaId: string, filters: IWorkshopBayFilters) {
  const { search, isActive, page = 1, limit = 20, sortBy = 'name', sortOrder = 'asc' } = filters
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
    (db as PrismaClient).workshopBay.findMany({ where, skip, take: limit, orderBy: { [sortBy]: sortOrder } }),
    (db as PrismaClient).workshopBay.count({ where }),
  ])
  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}

export async function findWorkshopBayById(db: Db, id: string, empresaId: string) {
  const item = await (db as PrismaClient).workshopBay.findFirst({ where: { id, empresaId } })
  if (!item) throw new NotFoundError('Bahía no encontrada')
  return item
}

export async function createWorkshopBay(db: Db, empresaId: string, data: ICreateWorkshopBayInput) {
  const exists = await (db as PrismaClient).workshopBay.findFirst({ where: { empresaId, code: data.code } })
  if (exists) throw new ConflictError(`Ya existe una bahía con el código ${data.code}`)
  return (db as PrismaClient).workshopBay.create({ data: { ...data, empresaId } })
}

export async function updateWorkshopBay(db: Db, id: string, empresaId: string, data: IUpdateWorkshopBayInput) {
  await findWorkshopBayById(db, id, empresaId)
  if (data.code) {
    const conflict = await (db as PrismaClient).workshopBay.findFirst({ where: { empresaId, code: data.code, NOT: { id } } })
    if (conflict) throw new ConflictError(`Ya existe una bahía con el código ${data.code}`)
  }
  return (db as PrismaClient).workshopBay.update({ where: { id }, data })
}

export async function toggleWorkshopBayActive(db: Db, id: string, empresaId: string) {
  const item = await findWorkshopBayById(db, id, empresaId)
  return (db as PrismaClient).workshopBay.update({ where: { id }, data: { isActive: !item.isActive } })
}

export async function deleteWorkshopBay(db: Db, id: string, empresaId: string) {
  await findWorkshopBayById(db, id, empresaId)
  const inUse = await (db as PrismaClient).serviceOrder.count({ where: { bayId: id } })
  if (inUse > 0) throw new ConflictError('No se puede eliminar: la bahía tiene órdenes de trabajo asociadas')
  await (db as PrismaClient).workshopBay.delete({ where: { id } })
}
