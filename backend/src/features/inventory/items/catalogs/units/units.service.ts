// backend/src/features/inventory/items/catalogs/units/units.service.ts
import prisma from '../../../../../services/prisma.service'

import {
  ICreateUnitInput,
  IUpdateUnitInput,
  IUnitFilters,
  IUnitWithRelations,
  IUnitGroupedByType,
  UnitType,
} from './units.interface'
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from '../../../../../shared/utils/apiError'
import { PaginationHelper } from '../../../../../shared/utils/pagination'
import { INVENTORY_MESSAGES } from '../../../shared/constants/messages'
import { UNIT_TYPE_LABELS } from '../../../shared/constants/inventory.constants'
import { logger } from '../../../../../shared/utils/logger'

export class UnitService {
  /**
   * Crear una nueva unidad
   */
  async create(
    data: ICreateUnitInput,
    userId?: string
  ): Promise<IUnitWithRelations> {
    try {
      // Verificar si el código ya existe
      const existingByCode = await prisma.unit.findUnique({
        where: { code: data.code.toUpperCase() },
      })

      if (existingByCode) {
        throw new ConflictError(INVENTORY_MESSAGES.unit.codeExists)
      }

      // Verificar si la abreviación ya existe
      const existingByAbbr = await prisma.unit.findUnique({
        where: { abbreviation: data.abbreviation },
      })

      if (existingByAbbr) {
        throw new ConflictError('La abreviación ya existe')
      }

      // Crear unidad
      const unit = await prisma.unit.create({
        data: {
          code: data.code.toUpperCase(),
          name: data.name,
          abbreviation: data.abbreviation,
          type: data.type,
          isActive: data.isActive ?? true,
        },
        include: {
          _count: {
            select: {
              items: true,
            },
          },
        },
      })

      logger.info('Unit created', {
        unitId: unit.id,
        code: unit.code,
        type: unit.type,
        userId,
      })

      return unit
    } catch (error) {
      logger.error('Error creating unit', { error, data, userId })
      throw error
    }
  }

  /**
   * Obtener todas las unidades con paginación y filtros
   */
  async findAll(
    filters: IUnitFilters,
    page: number = 1,
    limit: number = 10,
    prismaClient?: any
  ) {
    try {
      const db = prismaClient || prisma
      const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

      // Construir filtros
      const where: any = {}

      if (filters.search) {
        where.OR = [
          { code: { contains: filters.search, mode: 'insensitive' } },
          { name: { contains: filters.search, mode: 'insensitive' } },
          { abbreviation: { contains: filters.search, mode: 'insensitive' } },
        ]
      }

      if (filters.type) {
        where.type = filters.type
      }

      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive
      }

      // Ejecutar consultas en paralelo
      const [units, total] = await Promise.all([
        db.unit.findMany({
          where,
          skip,
          take,
          orderBy: [{ type: 'asc' }, { name: 'asc' }],
          include: {
            _count: {
              select: {
                items: true,
              },
            },
          },
        }),
        db.unit.count({ where }),
      ])

      const meta = PaginationHelper.getMeta(page, limit, total)

      return {
        units,
        ...meta,
      }
    } catch (error) {
      logger.error('Error finding units', { error, filters })
      throw error
    }
  }

  /**
   * Obtener unidad por ID
   */
  async findById(id: string): Promise<IUnitWithRelations> {
    try {
      const unit = await prisma.unit.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              items: true,
            },
          },
        },
      })

      if (!unit) {
        throw new NotFoundError(INVENTORY_MESSAGES.unit.notFound)
      }

      return unit
    } catch (error) {
      logger.error('Error finding unit by ID', { error, id })
      throw error
    }
  }

  /**
   * Obtener unidad por código
   */
  async findByCode(code: string): Promise<IUnitWithRelations | null> {
    try {
      const unit = await prisma.unit.findUnique({
        where: { code: code.toUpperCase() },
        include: {
          _count: {
            select: {
              items: true,
            },
          },
        },
      })

      return unit
    } catch (error) {
      logger.error('Error finding unit by code', { error, code })
      throw error
    }
  }

  /**
   * Obtener unidades por tipo
   */
  async findByType(type: UnitType): Promise<IUnitWithRelations[]> {
    try {
      const units = await prisma.unit.findMany({
        where: { type },
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              items: true,
            },
          },
        },
      })

      return units
    } catch (error) {
      logger.error('Error finding units by type', { error, type })
      throw error
    }
  }

  /**
   * Obtener unidades agrupadas por tipo
   */
  async findGroupedByType(): Promise<IUnitGroupedByType[]> {
    try {
      const types: UnitType[] = ['COUNTABLE', 'WEIGHT', 'VOLUME', 'LENGTH']
      const grouped: IUnitGroupedByType[] = []

      for (const type of types) {
        const units = await this.findByType(type)

        if (units.length > 0) {
          grouped.push({
            type,
            typeLabel: UNIT_TYPE_LABELS[type],
            units,
            count: units.length,
          })
        }
      }

      return grouped
    } catch (error) {
      logger.error('Error finding units grouped by type', { error })
      throw error
    }
  }

  /**
   * Actualizar unidad
   */
  async update(
    id: string,
    data: IUpdateUnitInput,
    userId?: string
  ): Promise<IUnitWithRelations> {
    try {
      // Verificar que existe
      await this.findById(id)

      // Si se actualiza el código, verificar que no exista otro
      if (data.code) {
        const existingByCode = await prisma.unit.findUnique({
          where: { code: data.code.toUpperCase() },
        })

        if (existingByCode && existingByCode.id !== id) {
          throw new ConflictError(INVENTORY_MESSAGES.unit.codeExists)
        }
      }

      // Si se actualiza la abreviación, verificar que no exista otra
      if (data.abbreviation) {
        const existingByAbbr = await prisma.unit.findUnique({
          where: { abbreviation: data.abbreviation },
        })

        if (existingByAbbr && existingByAbbr.id !== id) {
          throw new ConflictError('La abreviación ya existe')
        }
      }

      // Actualizar
      const unit = await prisma.unit.update({
        where: { id },
        data: {
          ...(data.code && { code: data.code.toUpperCase() }),
          ...(data.name && { name: data.name }),
          ...(data.abbreviation && { abbreviation: data.abbreviation }),
          ...(data.type && { type: data.type }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
        include: {
          _count: {
            select: {
              items: true,
            },
          },
        },
      })

      logger.info('Unit updated', { unitId: id, userId })

      return unit
    } catch (error) {
      logger.error('Error updating unit', { error, id, data, userId })
      throw error
    }
  }

  /**
   * Eliminar unidad (soft delete)
   */
  async delete(id: string, userId?: string): Promise<void> {
    try {
      const unit = await this.findById(id)

      // Verificar que no tenga items asociados
      if (unit._count && unit._count.items > 0) {
        throw new BadRequestError(INVENTORY_MESSAGES.unit.hasItems)
      }

      // Soft delete (marcar como inactivo)
      await prisma.unit.update({
        where: { id },
        data: { isActive: false },
      })

      logger.info('Unit soft deleted', { unitId: id, userId })
    } catch (error) {
      logger.error('Error deleting unit', { error, id, userId })
      throw error
    }
  }

  /**
   * Eliminar unidad permanentemente
   */
  async hardDelete(id: string, userId?: string): Promise<void> {
    try {
      const unit = await this.findById(id)

      // Verificar que no tenga items asociados
      if (unit._count && unit._count.items > 0) {
        throw new BadRequestError(INVENTORY_MESSAGES.unit.hasItems)
      }

      // Eliminar permanentemente
      await prisma.unit.delete({
        where: { id },
      })

      logger.info('Unit hard deleted', { unitId: id, userId })
    } catch (error) {
      logger.error('Error hard deleting unit', { error, id, userId })
      throw error
    }
  }

  /**
   * Activar/Desactivar unidad
   */
  async toggleActive(id: string, userId?: string): Promise<IUnitWithRelations> {
    try {
      const unit = await this.findById(id)

      const updated = await prisma.unit.update({
        where: { id },
        data: { isActive: !unit.isActive },
        include: {
          _count: {
            select: {
              items: true,
            },
          },
        },
      })

      logger.info('Unit active status toggled', {
        unitId: id,
        newStatus: updated.isActive,
        userId,
      })

      return updated
    } catch (error) {
      logger.error('Error toggling unit active status', { error, id, userId })
      throw error
    }
  }

  /**
   * Obtener unidades activas
   */
  async findActive(prismaClient?: any): Promise<IUnitWithRelations[]> {
    try {
      const db = prismaClient || prisma
      const units = await db.unit.findMany({
        where: { isActive: true },
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
        include: {
          _count: {
            select: {
              items: true,
            },
          },
        },
      })

      return units
    } catch (error) {
      logger.error('Error finding active units', { error })
      throw error
    }
  }

  /**
   * Buscar unidades
   */
  async search(
    term: string,
    limit: number = 10,
    prismaClient?: any
  ): Promise<IUnitWithRelations[]> {
    try {
      const db = prismaClient || prisma
      const units = await db.unit.findMany({
        where: {
          OR: [
            { code: { contains: term, mode: 'insensitive' } },
            { name: { contains: term, mode: 'insensitive' } },
            { abbreviation: { contains: term, mode: 'insensitive' } },
          ],
          isActive: true,
        },
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              items: true,
            },
          },
        },
      })

      return units
    } catch (error) {
      logger.error('Error searching units', { error, term })
      throw error
    }
  }

  /**
   * Importación masiva de unidades
   */
  async bulkCreate(units: ICreateUnitInput[], userId?: string) {
    try {
      const results = {
        success: [] as any[],
        errors: [] as any[],
      }

      for (const unitData of units) {
        try {
          const unit = await this.create(unitData, userId)
          results.success.push(unit)
        } catch (error: any) {
          results.errors.push({
            code: unitData.code,
            error: error.message,
          })
        }
      }

      logger.info('Bulk unit creation completed', {
        total: units.length,
        success: results.success.length,
        errors: results.errors.length,
        userId,
      })

      return results
    } catch (error) {
      logger.error('Error in bulk unit creation', { error, userId })
      throw error
    }
  }
}

export default new UnitService()
