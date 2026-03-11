// backend/src/features/inventory/warehouses/warehouses.service.ts

import prisma from '../../../services/prisma.service'
import {
  ICreateWarehouseInput,
  IUpdateWarehouseInput,
  IWarehouseFilters,
  IWarehouseWithRelations,
  WarehouseType,
} from './warehouses.interface'
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from '../../../shared/utils/apiError'
import { PaginationHelper } from '../../../shared/utils/pagination'
import { logger } from '../../../shared/utils/logger'
import { INVENTORY_MESSAGES } from '../shared/constants/messages'

export class WarehouseService {
  /**
   * Crear un nuevo almacén
   */
  async create(
    data: ICreateWarehouseInput,
    userId?: string
  ): Promise<IWarehouseWithRelations> {
    try {
      // Verificar si el código ya existe
      const existingCode = await prisma.warehouse.findUnique({
        where: { code: data.code.toUpperCase() },
      })

      if (existingCode) {
        throw new ConflictError('El código del almacén ya existe')
      }

      // Crear el almacén
      const warehouse = await prisma.warehouse.create({
        data: {
          code: data.code.toUpperCase(),
          name: data.name,
          type: data.type ?? WarehouseType.PRINCIPAL,
          address: data.address ?? null,
          isActive: data.isActive ?? true,
        },
        include: {
          stocks: true,
          movementsFrom: true,
          movementsTo: true,
          orders: true,
          preInvoices: true,
          exitNotes: true,
          purchaseOrders: true,
        },
      })

      logger.info(`Almacén creado: ${warehouse.id}`, {
        userId,
        warehouseId: warehouse.id,
        code: warehouse.code,
      })

      return warehouse as IWarehouseWithRelations
    } catch (error) {
      logger.error('Error al crear almacén', { error, data })
      throw error
    }
  }

  /**
   * Obtener almacén por ID
   */
  async findById(id: string): Promise<IWarehouseWithRelations> {
    try {
      const warehouse = await prisma.warehouse.findUnique({
        where: { id },
        include: {
          stocks: true,
          movementsFrom: true,
          movementsTo: true,
          orders: true,
          preInvoices: true,
          exitNotes: true,
          purchaseOrders: true,
        },
      })

      if (!warehouse) {
        throw new NotFoundError('Almacén no encontrado')
      }

      return warehouse as IWarehouseWithRelations
    } catch (error) {
      logger.error('Error al obtener almacén', { error, id })
      throw error
    }
  }

  /**
   * Obtener almacén por código
   */
  async findByCode(code: string): Promise<IWarehouseWithRelations> {
    try {
      const warehouse = await prisma.warehouse.findUnique({
        where: { code: code.toUpperCase() },
        include: {
          stocks: true,
          movementsFrom: true,
          movementsTo: true,
          orders: true,
          preInvoices: true,
          exitNotes: true,
          purchaseOrders: true,
        },
      })

      if (!warehouse) {
        throw new NotFoundError('Almacén no encontrado')
      }

      return warehouse as IWarehouseWithRelations
    } catch (error) {
      logger.error('Error al obtener almacén por código', { error, code })
      throw error
    }
  }

  /**
   * Obtener todos los almacenes con filtros
   */
  async findAll(
    filters: IWarehouseFilters = {},
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'name',
    sortOrder: 'asc' | 'desc' = 'asc',
    prismaClient?: any
  ): Promise<{
    items: IWarehouseWithRelations[]
    page: number
    limit: number
    total: number
  }> {
    try {
      const db = prismaClient || prisma
      const where: any = {}

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { code: { contains: filters.search, mode: 'insensitive' } },
          { address: { contains: filters.search, mode: 'insensitive' } },
        ]
      }

      if (filters.type) {
        where.type = filters.type
      }

      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive
      }

      if (filters.code) {
        where.code = filters.code.toUpperCase()
      }

      const total = await db.warehouse.count({ where })

      const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

      const warehouses = await db.warehouse.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          stocks: true,
          movementsFrom: true,
          movementsTo: true,
          orders: true,
          preInvoices: true,
          exitNotes: true,
          purchaseOrders: true,
        },
      })

      return {
        items: warehouses as IWarehouseWithRelations[],
        page,
        limit,
        total,
      }
    } catch (error) {
      logger.error('Error al obtener almacenes', { error, filters })
      throw error
    }
  }

  /**
   * Obtener almacenes activos
   */
  async findActive(limit: number = 100): Promise<IWarehouseWithRelations[]> {
    try {
      const warehouses = await prisma.warehouse.findMany({
        where: { isActive: true },
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          stocks: true,
          movementsFrom: true,
          movementsTo: true,
          orders: true,
          preInvoices: true,
          exitNotes: true,
          purchaseOrders: true,
        },
      })

      return warehouses as IWarehouseWithRelations[]
    } catch (error) {
      logger.error('Error al obtener almacenes activos', { error })
      throw error
    }
  }

  /**
   * Obtener almacenes por tipo
   */
  async findByType(
    type: WarehouseType,
    limit: number = 100
  ): Promise<IWarehouseWithRelations[]> {
    try {
      const warehouses = await prisma.warehouse.findMany({
        where: { type, isActive: true },
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          stocks: true,
          movementsFrom: true,
          movementsTo: true,
          orders: true,
          preInvoices: true,
          exitNotes: true,
          purchaseOrders: true,
        },
      })

      return warehouses as IWarehouseWithRelations[]
    } catch (error) {
      logger.error('Error al obtener almacenes por tipo', { error, type })
      throw error
    }
  }

  /**
   * Buscar almacenes
   */
  async search(
    term: string,
    limit: number = 20
  ): Promise<IWarehouseWithRelations[]> {
    try {
      const warehouses = await prisma.warehouse.findMany({
        where: {
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { code: { contains: term, mode: 'insensitive' } },
            { address: { contains: term, mode: 'insensitive' } },
          ],
        },
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          stocks: true,
          movementsFrom: true,
          movementsTo: true,
          orders: true,
          preInvoices: true,
          exitNotes: true,
          purchaseOrders: true,
        },
      })

      return warehouses as IWarehouseWithRelations[]
    } catch (error) {
      logger.error('Error al buscar almacenes', { error, term })
      throw error
    }
  }

  /**
   * Actualizar almacén
   */
  async update(
    id: string,
    data: IUpdateWarehouseInput,
    userId?: string
  ): Promise<IWarehouseWithRelations> {
    try {
      // Verificar que el almacén existe
      const existing = await prisma.warehouse.findUnique({
        where: { id },
      })

      if (!existing) {
        throw new NotFoundError('Almacén no encontrado')
      }

      // Si se va a actualizar el código, verificar que no exista otro con ese código
      if (data.code && data.code !== existing.code) {
        const existingCode = await prisma.warehouse.findUnique({
          where: { code: data.code.toUpperCase() },
        })

        if (existingCode) {
          throw new ConflictError('El código del almacén ya existe')
        }
      }

      // Actualizar
      const updateData: any = {}
      if (data.code) updateData.code = data.code.toUpperCase()
      if (data.name) updateData.name = data.name
      if (data.type) updateData.type = data.type
      if (data.address !== undefined) updateData.address = data.address
      if (data.isActive !== undefined) updateData.isActive = data.isActive

      const warehouse = await prisma.warehouse.update({
        where: { id },
        data: updateData,
        include: {
          stocks: true,
          movementsFrom: true,
          movementsTo: true,
          orders: true,
          preInvoices: true,
          exitNotes: true,
          purchaseOrders: true,
        },
      })

      logger.info(`Almacén actualizado: ${warehouse.id}`, {
        userId,
        warehouseId: warehouse.id,
        changes: data,
      })

      return warehouse as IWarehouseWithRelations
    } catch (error) {
      logger.error('Error al actualizar almacén', { error, id, data })
      throw error
    }
  }

  /**
   * Eliminar almacén (solo si no tiene movimientos)
   */
  async delete(id: string, userId?: string): Promise<void> {
    try {
      // Verificar que el almacén existe
      const warehouse = await prisma.warehouse.findUnique({
        where: { id },
        include: {
          stocks: true,
          movementsFrom: true,
          movementsTo: true,
          orders: true,
          preInvoices: true,
          exitNotes: true,
          purchaseOrders: true,
        },
      })

      if (!warehouse) {
        throw new NotFoundError('Almacén no encontrado')
      }

      // Verificar que no tenga movimientos relacionados
      if (
        (warehouse.stocks && warehouse.stocks.length > 0) ||
        (warehouse.movementsFrom && warehouse.movementsFrom.length > 0) ||
        (warehouse.movementsTo && warehouse.movementsTo.length > 0) ||
        (warehouse.orders && warehouse.orders.length > 0) ||
        (warehouse.preInvoices && warehouse.preInvoices.length > 0) ||
        (warehouse.exitNotes && warehouse.exitNotes.length > 0) ||
        (warehouse.purchaseOrders && warehouse.purchaseOrders.length > 0)
      ) {
        throw new BadRequestError(
          'No se puede eliminar un almacén que tenga movimientos associados. Intente desactivarlo en su lugar.'
        )
      }

      // Eliminar
      await prisma.warehouse.delete({
        where: { id },
      })

      logger.info(`Almacén eliminado: ${id}`, { userId })
    } catch (error) {
      logger.error('Error al eliminar almacén', { error, id })
      throw error
    }
  }

  /**
   * Desactivar almacén
   */
  async deactivate(
    id: string,
    userId?: string
  ): Promise<IWarehouseWithRelations> {
    try {
      const warehouse = await prisma.warehouse.findUnique({
        where: { id },
      })

      if (!warehouse) {
        throw new NotFoundError('Almacén no encontrado')
      }

      const updated = await prisma.warehouse.update({
        where: { id },
        data: { isActive: false },
        include: {
          stocks: true,
          movementsFrom: true,
          movementsTo: true,
          orders: true,
          preInvoices: true,
          exitNotes: true,
          purchaseOrders: true,
        },
      })

      logger.info(`Almacén desactivado: ${id}`, { userId })

      return updated as IWarehouseWithRelations
    } catch (error) {
      logger.error('Error al desactivar almacén', { error, id })
      throw error
    }
  }

  /**
   * Activar almacén
   */
  async activate(
    id: string,
    userId?: string
  ): Promise<IWarehouseWithRelations> {
    try {
      const warehouse = await prisma.warehouse.findUnique({
        where: { id },
      })

      if (!warehouse) {
        throw new NotFoundError('Almacén no encontrado')
      }

      const updated = await prisma.warehouse.update({
        where: { id },
        data: { isActive: true },
        include: {
          stocks: true,
          movementsFrom: true,
          movementsTo: true,
          orders: true,
          preInvoices: true,
          exitNotes: true,
          purchaseOrders: true,
        },
      })

      logger.info(`Almacén activado: ${id}`, { userId })

      return updated as IWarehouseWithRelations
    } catch (error) {
      logger.error('Error al activar almacén', { error, id })
      throw error
    }
  }
}
