// backend/src/features/workshop/serviceTypes/serviceTypes.service.ts
import type { PrismaClient } from '../../../generated/prisma/client.js'
import { NotFoundError, ConflictError } from '../../../shared/utils/apiError.js'
import type { IServiceTypeFilters, ICreateServiceTypeInput, IUpdateServiceTypeInput } from './serviceTypes.interface.js'

type Db = PrismaClient | Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

export async function findAllServiceTypes(db: Db, empresaId: string, filters: IServiceTypeFilters) {
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
    (db as PrismaClient).serviceType.findMany({ where, skip, take: limit, orderBy: { [sortBy]: sortOrder } }),
    (db as PrismaClient).serviceType.count({ where }),
  ])
  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}

export async function findServiceTypeById(db: Db, id: string, empresaId: string) {
  const item = await (db as PrismaClient).serviceType.findFirst({ where: { id, empresaId } })
  if (!item) throw new NotFoundError('Tipo de servicio no encontrado')
  return item
}

export async function createServiceType(db: Db, empresaId: string, data: ICreateServiceTypeInput) {
  const exists = await (db as PrismaClient).serviceType.findFirst({ where: { empresaId, code: data.code } })
  if (exists) throw new ConflictError(`Ya existe un tipo de servicio con el código ${data.code}`)
  return (db as PrismaClient).serviceType.create({
    data: { ...data, empresaId },
  })
}

export async function updateServiceType(db: Db, id: string, empresaId: string, data: IUpdateServiceTypeInput) {
  await findServiceTypeById(db, id, empresaId)
  if (data.code) {
    const conflict = await (db as PrismaClient).serviceType.findFirst({ where: { empresaId, code: data.code, NOT: { id } } })
    if (conflict) throw new ConflictError(`Ya existe un tipo de servicio con el código ${data.code}`)
  }
  return (db as PrismaClient).serviceType.update({ where: { id }, data })
}

export async function toggleServiceTypeActive(db: Db, id: string, empresaId: string) {
  const item = await findServiceTypeById(db, id, empresaId)
  return (db as PrismaClient).serviceType.update({ where: { id }, data: { isActive: !item.isActive } })
}

export async function deleteServiceType(db: Db, id: string, empresaId: string) {
  await findServiceTypeById(db, id, empresaId)
  // Verificar si tiene OTs o citas asociadas activas
  const inUse = await (db as PrismaClient).serviceOrder.count({ where: { serviceTypeId: id } })
  if (inUse > 0) throw new ConflictError('No se puede eliminar: el tipo de servicio tiene órdenes de trabajo asociadas')
  await (db as PrismaClient).serviceType.delete({ where: { id } })
}
