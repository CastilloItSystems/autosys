// backend/src/features/workshop/serviceOrderMaterials/serviceOrderMaterials.service.ts

import type { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from '../../../shared/utils/apiError.js'
import type {
  ICreateServiceOrderMaterial,
  IUpdateServiceOrderMaterial,
  IServiceOrderMaterialFilters,
  IServiceOrderMaterialWithRelations,
} from './serviceOrderMaterials.interface.js'

type DbType = PrismaClient | Prisma.TransactionClient

const BASE_INCLUDE = {
  serviceOrder: { select: { id: true } },
  item: { select: { id: true, code: true, name: true, sku: true } },
} as const

export async function findAll(
  db: DbType,
  serviceOrderId: string,
  filters: IServiceOrderMaterialFilters
): Promise<{ data: IServiceOrderMaterialWithRelations[]; pagination: any }> {
  const { status, search, page = 1, limit = 50 } = filters

  const where: any = { serviceOrderId }

  if (status) where.status = status
  if (search) {
    where.OR = [
      { description: { contains: search, mode: 'insensitive' } },
      {
        item: {
          OR: [
            { code: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
          ],
        },
      },
    ]
  }

  const skip = (page - 1) * limit

  const [data, total] = await Promise.all([
    (db as PrismaClient).serviceOrderMaterial.findMany({
      where,
      include: BASE_INCLUDE,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    (db as PrismaClient).serviceOrderMaterial.count({ where }),
  ])

  return {
    data: data as unknown as IServiceOrderMaterialWithRelations[],
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

export async function findById(
  db: DbType,
  id: string
): Promise<IServiceOrderMaterialWithRelations> {
  const material = await (db as PrismaClient).serviceOrderMaterial.findUnique({
    where: { id },
    include: BASE_INCLUDE,
  })

  if (!material) throw new NotFoundError('Material no encontrado')
  return material as unknown as IServiceOrderMaterialWithRelations
}

export async function create(
  db: DbType,
  data: ICreateServiceOrderMaterial
): Promise<IServiceOrderMaterialWithRelations> {
  // Verify serviceOrder exists
  const serviceOrder = await (db as PrismaClient).serviceOrder.findUnique({
    where: { id: data.serviceOrderId },
  })

  if (!serviceOrder) throw new NotFoundError('Orden de servicio no encontrada')

  // Verify item exists if provided
  if (data.itemId) {
    const item = await (db as PrismaClient).item.findUnique({
      where: { id: data.itemId },
    })
    if (!item) throw new NotFoundError('Artículo no encontrado')
  }

  const material = await (db as PrismaClient).serviceOrderMaterial.create({
    data: {
      description: data.description,
      quantityRequested: Number(data.quantityRequested),
      quantityReserved: Number(data.quantityReserved || 0),
      quantityDispatched: Number(data.quantityDispatched || 0),
      quantityConsumed: Number(data.quantityConsumed || 0),
      quantityReturned: Number(data.quantityReturned || 0),
      unitPrice: Number(data.unitPrice),
      unitCost: Number(data.unitCost || 0),
      status: data.status || 'REQUESTED',
      serviceOrderId: data.serviceOrderId,
      itemId: data.itemId,
      empresaId: serviceOrder.empresaId,
      createdBy: 'system',
    },
    include: BASE_INCLUDE,
  })

  return material as unknown as IServiceOrderMaterialWithRelations
}

export async function update(
  db: DbType,
  id: string,
  data: IUpdateServiceOrderMaterial
): Promise<IServiceOrderMaterialWithRelations> {
  await findById(db, id)

  if (data.itemId) {
    const item = await (db as PrismaClient).item.findUnique({
      where: { id: data.itemId },
    })
    if (!item) throw new NotFoundError('Artículo no encontrado')
  }

  const updateData: any = {}

  if (data.description !== undefined) updateData.description = data.description
  if (data.quantityRequested !== undefined)
    updateData.quantityRequested = Number(data.quantityRequested)
  if (data.quantityReserved !== undefined)
    updateData.quantityReserved = Number(data.quantityReserved)
  if (data.quantityDispatched !== undefined)
    updateData.quantityDispatched = Number(data.quantityDispatched)
  if (data.quantityConsumed !== undefined)
    updateData.quantityConsumed = Number(data.quantityConsumed)
  if (data.quantityReturned !== undefined)
    updateData.quantityReturned = Number(data.quantityReturned)
  if (data.unitPrice !== undefined)
    updateData.unitPrice = Number(data.unitPrice)
  if (data.unitCost !== undefined) updateData.unitCost = Number(data.unitCost)
  if (data.status !== undefined) updateData.status = data.status
  if (data.serviceOrderId !== undefined)
    updateData.serviceOrderId = data.serviceOrderId
  if (data.itemId !== undefined) updateData.itemId = data.itemId

  const material = await (db as PrismaClient).serviceOrderMaterial.update({
    where: { id },
    data: updateData,
    include: BASE_INCLUDE,
  })

  return material as unknown as IServiceOrderMaterialWithRelations
}

export async function remove(db: DbType, id: string): Promise<void> {
  await findById(db, id)

  await (db as PrismaClient).serviceOrderMaterial.delete({ where: { id } })
}

export async function findMovements(db: DbType, materialId: string) {
  const material = await findById(db, materialId)
  return (db as PrismaClient).serviceOrderMaterialMovement.findMany({
    where: { materialId: material.id },
    orderBy: { createdAt: 'asc' },
  })
}

export async function recordMovement(
  db: DbType,
  materialId: string,
  userId: string,
  data: {
    type: 'RESERVATION' | 'DISPATCH' | 'CONSUMPTION' | 'RETURN' | 'ADJUSTMENT' | 'CANCELLATION'
    quantity: number
    previousQuantity?: number
    warehouseId?: string
    warehouseName?: string
    notes?: string
    referenceId?: string
    empresaId: string
  }
) {
  await findById(db, materialId)
  return (db as PrismaClient).serviceOrderMaterialMovement.create({
    data: {
      materialId,
      type: data.type,
      quantity: data.quantity,
      previousQuantity: data.previousQuantity ?? null,
      warehouseId: data.warehouseId ?? null,
      warehouseName: data.warehouseName ?? null,
      userId,
      notes: data.notes ?? null,
      referenceId: data.referenceId ?? null,
      empresaId: data.empresaId,
    },
  })
}

export async function changeStatus(
  db: DbType,
  id: string,
  status:
    | 'REQUESTED'
    | 'RESERVED'
    | 'DISPATCHED'
    | 'CONSUMED'
    | 'RETURNED'
    | 'CANCELLED'
): Promise<IServiceOrderMaterialWithRelations> {
  const material = await findById(db, id)

  // Validate status transitions if needed
  const validTransitions: Record<string, string[]> = {
    REQUESTED: ['RESERVED', 'RETURNED', 'CANCELLED'],
    RESERVED: ['DISPATCHED', 'RETURNED', 'CANCELLED'],
    DISPATCHED: ['CONSUMED', 'RETURNED', 'CANCELLED'],
    CONSUMED: ['RETURNED'],
    RETURNED: [],
    CANCELLED: [],
  }

  if (!validTransitions[material.status as string]?.includes(status)) {
    throw new BadRequestError(
      `No se puede cambiar de estado ${material.status} a ${status}`
    )
  }

  const updated = await (db as PrismaClient).serviceOrderMaterial.update({
    where: { id },
    data: { status },
    include: BASE_INCLUDE,
  })

  return updated as unknown as IServiceOrderMaterialWithRelations
}
