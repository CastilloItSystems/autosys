import type { PrismaClient } from '../../../generated/prisma/client.js'
import { NotFoundError, ConflictError } from '../../../shared/utils/apiError.js'
import type { ICreateIngressMotive, IUpdateIngressMotive, IIngressMotiveFilters } from './ingressMotives.interface.js'

type Db = PrismaClient | Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

export async function findAll(db: Db, empresaId: string, filters: IIngressMotiveFilters) {
  const { isActive, search, page = 1, limit = 50 } = filters
  const where: any = { empresaId }
  if (isActive !== undefined) where.isActive = isActive
  if (search) {
    where.OR = [
      { code: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } }
    ]
  }
  const skip = (page - 1) * limit
  const [data, total] = await Promise.all([
    (db as PrismaClient).ingressMotive.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
    (db as PrismaClient).ingressMotive.count({ where })
  ])
  return { data, page, limit, total }
}

export async function findById(db: Db, id: string, empresaId: string) {
  const item = await (db as PrismaClient).ingressMotive.findFirst({ where: { id, empresaId } })
  if (!item) throw new NotFoundError('Registro no encontrado')
  return item
}

export async function create(db: Db, empresaId: string, userId: string, data: ICreateIngressMotive) {
  const exists = await (db as PrismaClient).ingressMotive.findUnique({ where: { empresaId_code: { empresaId, code: data.code } } })
  if (exists) throw new ConflictError('Ya existe un registro con este código')
  return (db as PrismaClient).ingressMotive.create({ data: { ...data, empresaId, createdBy: userId } })
}

export async function update(db: Db, id: string, empresaId: string, data: IUpdateIngressMotive) {
  await findById(db, id, empresaId)
  if (data.code) {
    const exists = await (db as PrismaClient).ingressMotive.findFirst({ where: { empresaId, code: data.code, NOT: { id } } })
    if (exists) throw new ConflictError('Ya existe otro registro con este código')
  }
  return (db as PrismaClient).ingressMotive.update({ where: { id }, data })
}

export async function remove(db: Db, id: string, empresaId: string) {
  await findById(db, id, empresaId)
  const inUse = await (db as PrismaClient).vehicleReception.findFirst({ where: { ingressMotiveId: id } })
  if (inUse) throw new ConflictError('No se puede eliminar porque está en uso')
  return (db as PrismaClient).ingressMotive.delete({ where: { id } })
}
