// backend/src/features/inventory/suppliers/suppliers.service.ts

import prisma from '../../../services/prisma.service'
import { logger } from '../../../shared/utils/logger'
import { PaginationHelper } from '../../../shared/helpers/pagination.helper'
import {
  NotFoundError,
  ConflictError,
} from '../../../shared/exceptions/api.error'
import {
  ISupplier,
  ICreateSupplierInput,
  IUpdateSupplierInput,
  ISupplierFilters,
} from './suppliers.interface'
import { INVENTORY_MESSAGES } from '../../../config/messages'

class SupplierService {
  /**
   * Crear proveedor
   */
  async create(data: ICreateSupplierInput): Promise<ISupplier> {
    try {
      // Validar código único
      const existingSupplier = await prisma.supplier.findUnique({
        where: { code: data.code },
      })

      if (existingSupplier) {
        throw new ConflictError(`Proveedor con código ${data.code} ya existe`)
      }

      const supplier = await prisma.supplier.create({
        data: {
          code: data.code,
          name: data.name,
          contactName: data.contactName,
          email: data.email,
          phone: data.phone,
          address: data.address,
          taxId: data.taxId,
        },
      })

      logger.info(`Proveedor creado: ${supplier.id}`, {
        code: supplier.code,
        name: supplier.name,
      })

      return supplier
    } catch (error) {
      logger.error('Error al crear proveedor', { error, data })
      throw error
    }
  }

  /**
   * Obtener proveedor por ID
   */
  async findById(id: string): Promise<ISupplier> {
    try {
      const supplier = await prisma.supplier.findUnique({
        where: { id },
      })

      if (!supplier) {
        throw new NotFoundError('Proveedor no encontrado')
      }

      return supplier
    } catch (error) {
      logger.error('Error al obtener proveedor', { error, id })
      throw error
    }
  }

  /**
   * Obtener proveedor por código
   */
  async findByCode(code: string): Promise<ISupplier> {
    try {
      const supplier = await prisma.supplier.findUnique({
        where: { code },
      })

      if (!supplier) {
        throw new NotFoundError('Proveedor no encontrado')
      }

      return supplier
    } catch (error) {
      logger.error('Error al obtener proveedor por código', { error, code })
      throw error
    }
  }

  /**
   * Obtener todos los proveedores con filtros y paginación
   */
  async findAll(
    filters: ISupplierFilters = {},
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'name',
    sortOrder: 'asc' | 'desc' = 'asc',
    prismaClient?: any
  ): Promise<{
    items: ISupplier[]
    total: number
    page: number
    limit: number
  }> {
    try {
      const db = prismaClient || prisma
      const { skip, take } = PaginationHelper.validateAndParse(page, limit)

      const where: any = {}
      if (filters.code)
        where.code = { contains: filters.code, mode: 'insensitive' }
      if (filters.name)
        where.name = { contains: filters.name, mode: 'insensitive' }
      if (filters.isActive !== undefined) where.isActive = filters.isActive

      const [total, suppliers] = await Promise.all([
        db.supplier.count({ where }),
        db.supplier.findMany({
          where,
          skip,
          take,
          orderBy: { [sortBy]: sortOrder },
        }),
      ])

      return {
        items: suppliers,
        total,
        page,
        limit,
      }
    } catch (error) {
      logger.error('Error al obtener proveedores', { error, filters })
      throw error
    }
  }

  /**
   * Obtener solo proveedores activos
   */
  async findActive(limit: number = 20): Promise<ISupplier[]> {
    try {
      const suppliers = await prisma.supplier.findMany({
        where: { isActive: true },
        take: limit,
        orderBy: { name: 'asc' },
      })

      return suppliers
    } catch (error) {
      logger.error('Error al obtener proveedores activos', { error })
      throw error
    }
  }

  /**
   * Actualizar proveedor
   */
  async update(id: string, data: IUpdateSupplierInput): Promise<ISupplier> {
    try {
      const supplier = await prisma.supplier.findUnique({
        where: { id },
      })

      if (!supplier) {
        throw new NotFoundError('Proveedor no encontrado')
      }

      // Si se cambia el código, validar que no exista otro con el mismo
      if (data.code && data.code !== supplier.code) {
        const existingSupplier = await prisma.supplier.findUnique({
          where: { code: data.code },
        })

        if (existingSupplier) {
          throw new ConflictError(`Proveedor con código ${data.code} ya existe`)
        }
      }

      const updated = await prisma.supplier.update({
        where: { id },
        data,
      })

      logger.info(`Proveedor actualizado: ${id}`, { data })

      return updated
    } catch (error) {
      logger.error('Error al actualizar proveedor', { error, id, data })
      throw error
    }
  }

  /**
   * Eliminar proveedor
   */
  async delete(id: string): Promise<any> {
    try {
      const supplier = await prisma.supplier.findUnique({
        where: { id },
      })

      if (!supplier) {
        throw new NotFoundError('Proveedor no encontrado')
      }

      // Validar que no tenga órdenes de compra asociadas
      const poCount = await prisma.purchaseOrder.count({
        where: { supplierId: id },
      })

      if (poCount > 0) {
        throw new ConflictError(
          'No se puede eliminar un proveedor que tiene órdenes de compra'
        )
      }

      await prisma.supplier.delete({ where: { id } })

      logger.info(`Proveedor eliminado: ${id}`)

      return { success: true, id }
    } catch (error) {
      logger.error('Error al eliminar proveedor', { error, id })
      throw error
    }
  }

  /**
   * Cambiar estado de proveedor
   */
  async toggleActive(id: string): Promise<ISupplier> {
    try {
      const supplier = await prisma.supplier.findUnique({
        where: { id },
      })

      if (!supplier) {
        throw new NotFoundError('Proveedor no encontrado')
      }

      const updated = await prisma.supplier.update({
        where: { id },
        data: { isActive: !supplier.isActive },
      })

      logger.info(`Estado del proveedor actualizado: ${id}`, {
        isActive: updated.isActive,
      })

      return updated
    } catch (error) {
      logger.error('Error al cambiar estado del proveedor', { error, id })
      throw error
    }
  }
}

export default new SupplierService()
