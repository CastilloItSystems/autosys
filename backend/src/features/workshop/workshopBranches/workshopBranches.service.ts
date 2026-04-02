// backend/src/features/workshop/workshopBranches/workshopBranches.service.ts
import type { PrismaClient } from '../../../generated/prisma/client.js'
import { NotFoundError, ConflictError } from '../../../shared/utils/apiError.js'

type Db = PrismaClient | Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

export interface IBranchFilters {
  search?: string
  isActive?: boolean
  page?: number
  limit?: number
}

export interface ICreateBranchInput {
  code: string
  name: string
  address?: string
  phone?: string
  managerUserId?: string
  createdBy: string
}

export interface IUpdateBranchInput {
  code?: string
  name?: string
  address?: string | null
  phone?: string | null
  managerUserId?: string | null
  isActive?: boolean
}

export async function findAllBranches(db: Db, empresaId: string, filters: IBranchFilters = {}) {
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
    (db as PrismaClient).workshopBranch.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
    (db as PrismaClient).workshopBranch.count({ where }),
  ])
  return { data, page, limit, total }
}

export async function findBranchById(db: Db, id: string, empresaId: string) {
  const item = await (db as PrismaClient).workshopBranch.findFirst({
    where: { id, empresaId },
    include: { bays: { where: { isActive: true }, select: { id: true, code: true, name: true } } },
  })
  if (!item) throw new NotFoundError('Sucursal no encontrada')
  return item
}

export async function createBranch(db: Db, empresaId: string, data: ICreateBranchInput) {
  const exists = await (db as PrismaClient).workshopBranch.findFirst({ where: { empresaId, code: data.code } })
  if (exists) throw new ConflictError(`Ya existe una sucursal con el código ${data.code}`)
  return (db as PrismaClient).workshopBranch.create({ data: { ...data, empresaId } })
}

export async function updateBranch(db: Db, id: string, empresaId: string, data: IUpdateBranchInput) {
  await findBranchById(db, id, empresaId)
  if (data.code) {
    const conflict = await (db as PrismaClient).workshopBranch.findFirst({ where: { empresaId, code: data.code, NOT: { id } } })
    if (conflict) throw new ConflictError(`Ya existe una sucursal con el código ${data.code}`)
  }
  return (db as PrismaClient).workshopBranch.update({ where: { id }, data })
}

export async function toggleBranchActive(db: Db, id: string, empresaId: string) {
  const item = await findBranchById(db, id, empresaId)
  return (db as PrismaClient).workshopBranch.update({ where: { id }, data: { isActive: !item.isActive } })
}
