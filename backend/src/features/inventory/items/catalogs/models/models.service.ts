// backend/src/features/inventory/items/catalogs/models/models.service.ts

import {
  ICreateModelInput,
  IUpdateModelInput,
  IModelFilters,
  IModelWithRelations,
  IModelGroupedByBrand,
} from './models.interface'
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from '../../../../../shared/utils/apiError'
import { PaginationHelper } from '../../../../../shared/utils/pagination'
import { INVENTORY_MESSAGES } from '../../../shared/constants/messages'
import { logger } from '../../../../../shared/utils/logger'
import prisma from '../../../../../services/prisma.service'

export class ModelService {
  /**
   * Crear un nuevo modelo de vehículo
   */
  async create(
    data: ICreateModelInput,
    userId?: string
  ): Promise<IModelWithRelations> {
    try {
      // Verificar que la marca existe
      const brand = await prisma.brand.findUnique({
        where: { id: data.brandId },
      })

      if (!brand) {
        throw new NotFoundError('Marca no encontrada')
      }

      if (!brand.isActive) {
        throw new BadRequestError('La marca no está activa')
      }

      // Verificar si ya existe un modelo con el mismo nombre, marca y año
      const existing = await prisma.model.findFirst({
        where: {
          brandId: data.brandId,
          name: data.name,
          year: data.year || null,
        },
      })

      if (existing) {
        throw new ConflictError(INVENTORY_MESSAGES.model.alreadyExists)
      }

      // Crear modelo
      const model = await prisma.model.create({
        data: {
          brandId: data.brandId,
          code: data.code ?? null,
          name: data.name,
          year: data.year ?? null,
          type: data.type ?? 'PART',
          description: data.description ?? null,
          specifications: data.specifications,
          isActive: data.isActive ?? true,
        },
        include: {
          brand: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          _count: {
            select: {
              items: true,
            },
          },
        },
      })

      logger.info('Model created', {
        modelId: model.id,
        brandId: model.brandId,
        name: model.name,
        userId,
      })

      return model as IModelWithRelations
    } catch (error) {
      logger.error('Error creating model', { error, data, userId })
      throw error
    }
  }

  /**
   * Obtener todos los modelos con paginación y filtros
   */
  async findAll(
    filters: IModelFilters,
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
        where.name = { contains: filters.search, mode: 'insensitive' }
      }

      if (filters.brandId) {
        where.brandId = filters.brandId
      }

      if (filters.year !== undefined) {
        where.year = filters.year
      }

      if (filters.type !== undefined) {
        where.type = filters.type
      }

      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive
      }

      // Ejecutar consultas en paralelo
      const [models, total] = await Promise.all([
        db.model.findMany({
          where,
          skip,
          take,
          orderBy: [{ name: 'asc' }, { year: 'desc' }],
          include: {
            brand: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
            _count: {
              select: {
                items: true,
              },
            },
          },
        }),
        db.model.count({ where }),
      ])

      const meta = PaginationHelper.getMeta(page, limit, total)

      return {
        models,
        ...meta,
      }
    } catch (error) {
      logger.error('Error finding models', { error, filters })
      throw error
    }
  }

  /**
   * Obtener modelo por ID
   */
  async findById(id: string): Promise<IModelWithRelations> {
    try {
      const model = await prisma.model.findUnique({
        where: { id },
        include: {
          brand: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          _count: {
            select: {
              items: true,
            },
          },
        },
      })

      if (!model) {
        throw new NotFoundError(INVENTORY_MESSAGES.model.notFound)
      }

      return model as IModelWithRelations
    } catch (error) {
      logger.error('Error finding model by ID', { error, id })
      throw error
    }
  }

  /**
   * Obtener modelos por marca
   */
  async findByBrand(brandId: string): Promise<IModelWithRelations[]> {
    try {
      // Verificar que la marca existe
      const brand = await prisma.brand.findUnique({
        where: { id: brandId },
      })

      if (!brand) {
        throw new NotFoundError('Marca no encontrada')
      }

      const models = await prisma.model.findMany({
        where: { brandId },
        orderBy: [{ name: 'asc' }, { year: 'desc' }],
        include: {
          brand: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          _count: {
            select: {
              items: true,
            },
          },
        },
      })

      return models as IModelWithRelations[]
    } catch (error) {
      logger.error('Error finding models by brand', { error, brandId })
      throw error
    }
  }

  /**
   * Obtener modelos agrupados por marca
   */
  async findGroupedByBrand(): Promise<IModelGroupedByBrand[]> {
    try {
      const brands = await prisma.brand.findMany({
        where: { isActive: true },
        select: {
          id: true,
          code: true,
          name: true,
        },
        orderBy: { name: 'asc' },
      })

      const grouped: IModelGroupedByBrand[] = []

      for (const brand of brands) {
        const models = await this.findByBrand(brand.id)

        if (models.length > 0) {
          grouped.push({
            brand,
            models,
            count: models.length,
          })
        }
      }

      return grouped
    } catch (error) {
      logger.error('Error finding models grouped by brand', { error })
      throw error
    }
  }

  /**
   * Obtener modelos por año
   */
  async findByYear(year: number): Promise<IModelWithRelations[]> {
    try {
      const models = await prisma.model.findMany({
        where: { year },
        orderBy: [{ brand: { name: 'asc' } }, { name: 'asc' }],
        include: {
          brand: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          _count: {
            select: {
              items: true,
            },
          },
        },
      })

      return models as IModelWithRelations[]
    } catch (error) {
      logger.error('Error finding models by year', { error, year })
      throw error
    }
  }

  /**
   * Actualizar modelo
   */
  async update(
    id: string,
    data: IUpdateModelInput,
    userId?: string
  ): Promise<IModelWithRelations> {
    try {
      // Verificar que existe
      const existing = await this.findById(id)

      // Si se actualiza la marca, verificar que existe
      if (data.brandId) {
        const brand = await prisma.brand.findUnique({
          where: { id: data.brandId },
        })

        if (!brand) {
          throw new NotFoundError('Marca no encontrada')
        }

        if (!brand.isActive) {
          throw new BadRequestError('La marca no está activa')
        }
      }

      // Verificar unicidad (nombre + marca + año)
      if (data.name !== undefined || data.brandId || data.year !== undefined) {
        const checkData = {
          brandId: data.brandId || existing.brandId,
          name: data.name || existing.name,
          year: data.year !== undefined ? data.year : existing.year,
        }

        const duplicate = await prisma.model.findFirst({
          where: {
            brandId: checkData.brandId,
            name: checkData.name,
            year: checkData.year || null,
            id: { not: id },
          },
        })

        if (duplicate) {
          throw new ConflictError(INVENTORY_MESSAGES.model.alreadyExists)
        }
      }

      // Actualizar
      const model = await prisma.model.update({
        where: { id },
        data: {
          ...(data.brandId && { brandId: data.brandId }),
          ...(data.code !== undefined && { code: data.code }),
          ...(data.name && { name: data.name }),
          ...(data.year !== undefined && { year: data.year }),
          ...(data.type && { type: data.type }),
          ...(data.description !== undefined && {
            description: data.description,
          }),
          ...(data.specifications !== undefined && {
            specifications: data.specifications,
          }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
        include: {
          brand: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          _count: {
            select: {
              items: true,
            },
          },
        },
      })

      logger.info('Model updated', { modelId: id, userId })

      return model as IModelWithRelations
    } catch (error) {
      logger.error('Error updating model', { error, id, data, userId })
      throw error
    }
  }

  /**
   * Eliminar modelo (soft delete)
   */
  async delete(id: string, userId?: string): Promise<void> {
    try {
      const model = await this.findById(id)

      // Verificar que no tenga items asociados
      if (model._count && model._count.items > 0) {
        throw new BadRequestError(INVENTORY_MESSAGES.model.hasItems)
      }

      // Soft delete (marcar como inactivo)
      await prisma.model.update({
        where: { id },
        data: { isActive: false },
      })

      logger.info('Model soft deleted', { modelId: id, userId })
    } catch (error) {
      logger.error('Error deleting model', { error, id, userId })
      throw error
    }
  }

  /**
   * Eliminar modelo permanentemente
   */
  async hardDelete(id: string, userId?: string): Promise<void> {
    try {
      const model = await this.findById(id)

      // Verificar que no tenga items asociados
      if (model._count && model._count.items > 0) {
        throw new BadRequestError(INVENTORY_MESSAGES.model.hasItems)
      }

      // Eliminar permanentemente
      await prisma.model.delete({
        where: { id },
      })

      logger.info('Model hard deleted', { modelId: id, userId })
    } catch (error) {
      logger.error('Error hard deleting model', { error, id, userId })
      throw error
    }
  }

  /**
   * Activar/Desactivar modelo
   */
  async toggleActive(
    id: string,
    userId?: string
  ): Promise<IModelWithRelations> {
    try {
      const model = await this.findById(id)

      const updated = await prisma.model.update({
        where: { id },
        data: { isActive: !model.isActive },
        include: {
          brand: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          _count: {
            select: {
              items: true,
            },
          },
        },
      })

      logger.info('Model active status toggled', {
        modelId: id,
        newStatus: updated.isActive,
        userId,
      })

      return updated as IModelWithRelations
    } catch (error) {
      logger.error('Error toggling model active status', {
        error,
        id,
        userId,
      })
      throw error
    }
  }

  /**
   * Obtener modelos activos
   */
  async findActive(prismaClient?: any): Promise<IModelWithRelations[]> {
    try {
      const db = prismaClient || prisma
      const models = await db.model.findMany({
        where: { isActive: true },
        orderBy: [
          { brand: { name: 'asc' } },
          { name: 'asc' },
          { year: 'desc' },
        ],
        include: {
          brand: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          _count: {
            select: {
              items: true,
            },
          },
        },
      })

      return models as IModelWithRelations[]
    } catch (error) {
      logger.error('Error finding active models', { error })
      throw error
    }
  }

  /**
   * Buscar modelos
   */
  async search(
    term: string,
    limit: number = 10,
    prismaClient?: any
  ): Promise<IModelWithRelations[]> {
    try {
      const db = prismaClient || prisma
      const models = await db.model.findMany({
        where: {
          name: { contains: term, mode: 'insensitive' },
          isActive: true,
        },
        take: limit,
        orderBy: [
          { brand: { name: 'asc' } },
          { name: 'asc' },
          { year: 'desc' },
        ],
        include: {
          brand: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          _count: {
            select: {
              items: true,
            },
          },
        },
      })

      return models as IModelWithRelations[]
    } catch (error) {
      logger.error('Error searching models', { error, term })
      throw error
    }
  }

  /**
   * Obtener años disponibles
   */
  async getAvailableYears(): Promise<number[]> {
    try {
      const models = await prisma.model.findMany({
        where: {
          year: { not: null },
          isActive: true,
        },
        select: { year: true },
        distinct: ['year'],
        orderBy: { year: 'desc' },
      })

      return models.map((m) => m.year!).filter(Boolean)
    } catch (error) {
      logger.error('Error getting available years', { error })
      throw error
    }
  }

  /**
   * Importación masiva de modelos
   */
  async bulkCreate(models: ICreateModelInput[], userId?: string) {
    try {
      const results = {
        success: [] as any[],
        errors: [] as any[],
      }

      for (const modelData of models) {
        try {
          const model = await this.create(modelData, userId)
          results.success.push(model)
        } catch (error: any) {
          results.errors.push({
            name: modelData.name,
            brandId: modelData.brandId,
            error: error.message,
          })
        }
      }

      logger.info('Bulk model creation completed', {
        total: models.length,
        success: results.success.length,
        errors: results.errors.length,
        userId,
      })

      return results
    } catch (error) {
      logger.error('Error in bulk model creation', { error, userId })
      throw error
    }
  }
}

export default new ModelService()
