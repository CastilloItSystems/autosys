// backend/src/features/inventory/warehouses/warehouses.service.ts

import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import { logger } from '../../../shared/utils/logger.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from '../../../shared/utils/apiError.js'
import { INVENTORY_MESSAGES } from '../shared/constants/messages.js'

const MSG = INVENTORY_MESSAGES.warehouse
import {
  ICreateWarehouseInput,
  IUpdateWarehouseInput,
  IWarehouseFilters,
  IWarehouseWithRelations,
  WarehouseType,
} from './warehouses.interface.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

// Include liviano para listas
const LIST_INCLUDE = {
  _count: {
    select: { stocks: true, exitNotes: true, entryNotes: true },
  },
}

// Include completo para getOne
const FULL_INCLUDE = {
  stocks: {
    select: { itemId: true, quantityReal: true, quantityAvailable: true },
  },
  _count: {
    select: {
      movementsFrom: true,
      movementsTo: true,
      exitNotes: true,
      entryNotes: true,
      purchaseOrders: true,
      adjustments: true,
    },
  },
}

class WarehouseService {
  async create(
    data: ICreateWarehouseInput,
    userId: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IWarehouseWithRelations> {
    const code = data.code.toUpperCase()

    const existing = await (db as PrismaClient).warehouse.findFirst({
      where: { code, empresaId },
    })
    if (existing) throw new ConflictError(MSG.codeExists)

    const warehouse = await (db as PrismaClient).warehouse.create({
      data: {
        code,
        name: data.name,
        type: data.type ?? WarehouseType.PRINCIPAL,
        address: data.address ?? null,
        isActive: data.isActive ?? true,
        empresaId,
      },
      include: FULL_INCLUDE,
    })

    logger.info('Almacén creado', { userId, warehouseId: warehouse.id, code })

    return warehouse as IWarehouseWithRelations
  }

  async findById(
    id: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IWarehouseWithRelations> {
    const warehouse = await (db as PrismaClient).warehouse.findFirst({
      where: { id, empresaId },
      include: FULL_INCLUDE,
    })

    if (!warehouse) throw new NotFoundError(MSG.notFound)

    return warehouse as IWarehouseWithRelations
  }

  async findAll(
    filters: IWarehouseFilters,
    page: number,
    limit: number,
    sortBy: string,
    sortOrder: 'asc' | 'desc',
    empresaId: string,
    db: PrismaClientType
  ): Promise<{
    items: IWarehouseWithRelations[]
    page: number
    limit: number
    total: number
  }> {
    const where: Prisma.WarehouseWhereInput = { empresaId }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
        { address: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    if (filters.type) where.type = filters.type as any
    if (filters.isActive !== undefined) where.isActive = filters.isActive
    if (filters.code) where.code = filters.code.toUpperCase()

    const validSortFields = ['name', 'code', 'type', 'createdAt']
    const orderBy = validSortFields.includes(sortBy)
      ? { [sortBy]: sortOrder }
      : { name: sortOrder }

    const skip = PaginationHelper.getOffset(page, limit)

    const [total, warehouses] = await Promise.all([
      (db as PrismaClient).warehouse.count({ where }),
      (db as PrismaClient).warehouse.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: LIST_INCLUDE,
      }),
    ])

    return {
      items: warehouses as IWarehouseWithRelations[],
      page,
      limit,
      total,
    }
  }

  async findActive(
    empresaId: string,
    db: PrismaClientType,
    limit: number = 100
  ): Promise<IWarehouseWithRelations[]> {
    const warehouses = await (db as PrismaClient).warehouse.findMany({
      where: { isActive: true, empresaId },
      take: limit,
      orderBy: { name: 'asc' },
      include: LIST_INCLUDE,
    })

    return warehouses as IWarehouseWithRelations[]
  }

  async search(
    term: string,
    empresaId: string,
    db: PrismaClientType,
    limit: number = 20
  ): Promise<IWarehouseWithRelations[]> {
    const warehouses = await (db as PrismaClient).warehouse.findMany({
      where: {
        empresaId,
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { code: { contains: term, mode: 'insensitive' } },
          { address: { contains: term, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { name: 'asc' },
      include: LIST_INCLUDE,
    })

    return warehouses as IWarehouseWithRelations[]
  }

  async update(
    id: string,
    data: IUpdateWarehouseInput,
    userId: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IWarehouseWithRelations> {
    const existing = await (db as PrismaClient).warehouse.findFirst({
      where: { id, empresaId },
    })
    if (!existing) throw new NotFoundError(MSG.notFound)

    if (data.code && data.code.toUpperCase() !== existing.code) {
      const duplicate = await (db as PrismaClient).warehouse.findFirst({
        where: { code: data.code.toUpperCase(), empresaId },
      })
      if (duplicate) throw new ConflictError(MSG.codeExists)
    }

    const updateData: Prisma.WarehouseUpdateInput = {}
    if (data.code !== undefined) updateData.code = data.code.toUpperCase()
    if (data.name !== undefined) updateData.name = data.name
    if (data.type !== undefined) updateData.type = data.type as any
    if (data.address !== undefined) updateData.address = data.address ?? null
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    const warehouse = await (db as PrismaClient).warehouse.update({
      where: { id },
      data: updateData,
      include: FULL_INCLUDE,
    })

    logger.info('Almacén actualizado', { userId, warehouseId: id })

    return warehouse as IWarehouseWithRelations
  }

  async delete(
    id: string,
    userId: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<void> {
    const warehouse = await (db as PrismaClient).warehouse.findFirst({
      where: { id, empresaId },
      include: {
        _count: {
          select: {
            stocks: true,
            movementsFrom: true,
            movementsTo: true,
            exitNotes: true,
            entryNotes: true,
            purchaseOrders: true,
            adjustments: true,
          },
        },
      },
    })

    if (!warehouse) throw new NotFoundError(MSG.notFound)

    const counts = (warehouse as any)._count
    const hasData = Object.values(counts as Record<string, number>).some(
      (n) => n > 0
    )

    if (hasData) {
      throw new BadRequestError(MSG.hasStock)
    }

    await (db as PrismaClient).warehouse.delete({ where: { id } })

    logger.info('Almacén eliminado', { userId, warehouseId: id })
  }

  async deactivate(
    id: string,
    userId: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IWarehouseWithRelations> {
    const existing = await (db as PrismaClient).warehouse.findFirst({
      where: { id, empresaId },
    })
    if (!existing) throw new NotFoundError(MSG.notFound)

    const warehouse = await (db as PrismaClient).warehouse.update({
      where: { id },
      data: { isActive: false },
      include: FULL_INCLUDE,
    })

    logger.info('Almacén desactivado', { userId, warehouseId: id })

    return warehouse as IWarehouseWithRelations
  }

  async activate(
    id: string,
    userId: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IWarehouseWithRelations> {
    const existing = await (db as PrismaClient).warehouse.findFirst({
      where: { id, empresaId },
    })
    if (!existing) throw new NotFoundError(MSG.notFound)

    const warehouse = await (db as PrismaClient).warehouse.update({
      where: { id },
      data: { isActive: true },
      include: FULL_INCLUDE,
    })

    logger.info('Almacén activado', { userId, warehouseId: id })

    return warehouse as IWarehouseWithRelations
  }
}

export default new WarehouseService()
