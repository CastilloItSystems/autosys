// backend/src/features/workshop/workshopOperations/workshopOperations.service.ts
import type { PrismaClient } from '../../../generated/prisma/client.js'
import { NotFoundError, ConflictError } from '../../../shared/utils/apiError.js'
import type {
  IWorkshopOperationFilters,
  ICreateWorkshopOperationInput,
  IUpdateWorkshopOperationInput,
} from './workshopOperations.interface.js'

type Db =
  | PrismaClient
  | Omit<
      PrismaClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >

const INCLUDE = {
  serviceType: { select: { id: true, code: true, name: true } },
  requiredSpecialty: { select: { id: true, code: true, name: true } },
  suggestedMaterials: {
    include: {
      item: { select: { id: true, name: true, code: true, sku: true } },
    },
    orderBy: { isRequired: 'desc' as const },
  },
} as const

export async function findAllWorkshopOperations(
  db: Db,
  empresaId: string,
  filters: IWorkshopOperationFilters
) {
  const {
    search,
    serviceTypeId,
    difficulty,
    requiredSpecialtyId,
    isActive,
    page = 1,
    limit = 20,
    sortBy = 'name',
    sortOrder = 'asc',
  } = filters
  const where: any = { empresaId }
  if (isActive !== undefined) where.isActive = isActive
  if (serviceTypeId) where.serviceTypeId = serviceTypeId
  if (difficulty) where.difficulty = difficulty
  if (requiredSpecialtyId) where.requiredSpecialtyId = requiredSpecialtyId
  if (search) {
    where.OR = [
      { code: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
      { tags: { has: search } },
    ]
  }
  const skip = (page - 1) * limit
  const [data, total] = await Promise.all([
    (db as PrismaClient).workshopOperation.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: INCLUDE,
    }),
    (db as PrismaClient).workshopOperation.count({ where }),
  ])
  return { data, page, limit, total }
}

export async function findWorkshopOperationById(
  db: Db,
  id: string,
  empresaId: string
) {
  const item = await (db as PrismaClient).workshopOperation.findFirst({
    where: { id, empresaId },
    include: INCLUDE,
  })
  if (!item) throw new NotFoundError('Operación no encontrada')
  return item
}

export async function createWorkshopOperation(
  db: Db,
  empresaId: string,
  data: ICreateWorkshopOperationInput,
  createdBy?: string
) {
  const exists = await (db as PrismaClient).workshopOperation.findFirst({
    where: { empresaId, code: data.code },
  })
  if (exists)
    throw new ConflictError(
      `Ya existe una operación con el código ${data.code}`
    )

  if (data.serviceTypeId) {
    const st = await (db as PrismaClient).serviceType.findFirst({
      where: { id: data.serviceTypeId, empresaId },
    })
    if (!st) throw new NotFoundError('Tipo de servicio no encontrado')
  }
  if (data.requiredSpecialtyId) {
    const sp = await (db as PrismaClient).technicianSpecialty.findFirst({
      where: { id: data.requiredSpecialtyId, empresaId },
    })
    if (!sp) throw new NotFoundError('Especialidad técnica no encontrada')
  }

  const { suggestedMaterials, ...rest } = data
  return (db as PrismaClient).workshopOperation.create({
    data: {
      ...rest,
      empresaId,
      ...(suggestedMaterials?.length
        ? { suggestedMaterials: { create: suggestedMaterials } }
        : {}),
    },
    include: INCLUDE,
  })
}

export async function updateWorkshopOperation(
  db: Db,
  id: string,
  empresaId: string,
  data: IUpdateWorkshopOperationInput
) {
  await findWorkshopOperationById(db, id, empresaId)
  if (data.code) {
    const conflict = await (db as PrismaClient).workshopOperation.findFirst({
      where: { empresaId, code: data.code, NOT: { id } },
    })
    if (conflict)
      throw new ConflictError(
        `Ya existe una operación con el código ${data.code}`
      )
  }
  if (data.serviceTypeId) {
    const st = await (db as PrismaClient).serviceType.findFirst({
      where: { id: data.serviceTypeId, empresaId },
    })
    if (!st) throw new NotFoundError('Tipo de servicio no encontrado')
  }
  if (data.requiredSpecialtyId) {
    const sp = await (db as PrismaClient).technicianSpecialty.findFirst({
      where: { id: data.requiredSpecialtyId, empresaId },
    })
    if (!sp) throw new NotFoundError('Especialidad técnica no encontrada')
  }

  const { suggestedMaterials, ...rest } = data
  return (db as PrismaClient).workshopOperation.update({
    where: { id },
    data: {
      ...rest,
      ...(suggestedMaterials !== undefined
        ? {
            suggestedMaterials: {
              deleteMany: {},
              create: suggestedMaterials,
            },
          }
        : {}),
    },
    include: INCLUDE,
  })
}

export async function toggleWorkshopOperationActive(
  db: Db,
  id: string,
  empresaId: string
) {
  const item = await findWorkshopOperationById(db, id, empresaId)
  return (db as PrismaClient).workshopOperation.update({
    where: { id },
    data: { isActive: !item.isActive },
    include: INCLUDE,
  })
}

export async function deleteWorkshopOperation(
  db: Db,
  id: string,
  empresaId: string
) {
  await findWorkshopOperationById(db, id, empresaId)
  const inUse = await (db as PrismaClient).serviceOrderItem.count({
    where: { operationId: id },
  })
  if (inUse > 0)
    throw new ConflictError(
      'No se puede eliminar: la operación está usada en órdenes de trabajo'
    )
  await (db as PrismaClient).workshopOperation.delete({ where: { id } })
}
