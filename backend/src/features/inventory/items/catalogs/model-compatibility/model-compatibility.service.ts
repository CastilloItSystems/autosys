// backend/src/features/inventory/items/catalogs/model-compatibility/model-compatibility.service.ts

import prisma from '../../../../../services/prisma.service'
import { logger } from '../../../../../shared/utils/logger'
import {
  ConflictError,
  NotFoundError,
  BadRequestError,
} from '../../../../../shared/utils/apiError'
import { PaginationHelper } from '../../../../../shared/utils/pagination'
import {
  ICreateCompatibilityInput,
  IUpdateCompatibilityInput,
  ICompatibilityFilters,
  IModelCompatibilityWithRelations,
} from './model-compatibility.interface'

const MESSAGES = {
  alreadyExists: 'La compatibilidad entre estos modelos ya existe',
  notFound: 'Compatibilidad no encontrada',
  partModelNotFound: 'Modelo de parte no encontrado',
  vehicleModelNotFound: 'Modelo de vehículo no encontrado',
  samePart: 'No se puede crear compatibilidad entre el mismo modelo',
}

class ModelCompatibilityService {
  /**
   * Crear nueva compatibilidad
   */
  async create(
    data: ICreateCompatibilityInput,
    userId?: string
  ): Promise<IModelCompatibilityWithRelations> {
    try {
      // Validar que no sea el mismo modelo
      if (data.partModelId === data.vehicleModelId) {
        throw new BadRequestError(MESSAGES.samePart)
      }

      // Verificar que ambos modelos existen
      const [partModel, vehicleModel] = await Promise.all([
        prisma.model.findUnique({ where: { id: data.partModelId } }),
        prisma.model.findUnique({ where: { id: data.vehicleModelId } }),
      ])

      if (!partModel) {
        throw new NotFoundError(MESSAGES.partModelNotFound)
      }

      if (!vehicleModel) {
        throw new NotFoundError(MESSAGES.vehicleModelNotFound)
      }

      // Verificar que no ya existe la relación (en ambas direcciones)
      const existing = await prisma.modelCompatibility.findFirst({
        where: {
          OR: [
            {
              partModelId: data.partModelId,
              vehicleModelId: data.vehicleModelId,
            },
            {
              partModelId: data.vehicleModelId,
              vehicleModelId: data.partModelId,
            },
          ],
        },
      })

      if (existing) {
        throw new ConflictError(MESSAGES.alreadyExists)
      }

      // Crear compatibilidad
      const compatibility = await prisma.modelCompatibility.create({
        data: {
          partModelId: data.partModelId,
          vehicleModelId: data.vehicleModelId,
          notes: data.notes ?? null,
          isVerified: data.isVerified ?? false,
        },
        include: {
          partModel: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true,
              brand: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
          },
          vehicleModel: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true,
              brand: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
      })

      logger.info('Model compatibility created', {
        compatibilityId: compatibility.id,
        partModelId: data.partModelId,
        vehicleModelId: data.vehicleModelId,
        userId,
      })

      return compatibility as IModelCompatibilityWithRelations
    } catch (error) {
      logger.error('Error creating model compatibility', {
        error,
        data,
        userId,
      })
      throw error
    }
  }

  /**
   * Obtener todas las compatibilidades con filtros y paginación
   */
  async findAll(
    filters: ICompatibilityFilters = {},
    page: number = 1,
    limit: number = 10
  ): Promise<{ data: IModelCompatibilityWithRelations[]; total: number }> {
    try {
      const where: any = {}

      if (filters.partModelId) {
        where.partModelId = filters.partModelId
      }

      if (filters.vehicleModelId) {
        where.vehicleModelId = filters.vehicleModelId
      }

      if (filters.isVerified !== undefined) {
        where.isVerified = filters.isVerified
      }

      const {
        skip,
        take,
        page: validPage,
        limit: validLimit,
      } = PaginationHelper.validateAndParse({ page, limit })

      const [total, compatibilities] = await Promise.all([
        prisma.modelCompatibility.count({ where }),
        prisma.modelCompatibility.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: {
            partModel: {
              select: {
                id: true,
                code: true,
                name: true,
                type: true,
                brand: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                  },
                },
              },
            },
            vehicleModel: {
              select: {
                id: true,
                code: true,
                name: true,
                type: true,
                brand: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                  },
                },
              },
            },
          },
        }),
      ])

      const meta = PaginationHelper.getMeta(validPage, validLimit, total)

      return {
        data: compatibilities as IModelCompatibilityWithRelations[],
        ...meta,
      }
    } catch (error) {
      logger.error('Error finding model compatibilities', { error, filters })
      throw error
    }
  }

  /**
   * Obtener compatibilidad por ID
   */
  async findById(id: string): Promise<IModelCompatibilityWithRelations> {
    try {
      const compatibility = await prisma.modelCompatibility.findUnique({
        where: { id },
        include: {
          partModel: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true,
              brand: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
          },
          vehicleModel: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true,
              brand: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
      })

      if (!compatibility) {
        throw new NotFoundError(MESSAGES.notFound)
      }

      return compatibility as IModelCompatibilityWithRelations
    } catch (error) {
      logger.error('Error finding model compatibility by ID', { error, id })
      throw error
    }
  }

  /**
   * Obtener compatibilidades de un modelo de parte
   */
  async findByPartModel(
    partModelId: string
  ): Promise<IModelCompatibilityWithRelations[]> {
    try {
      const model = await prisma.model.findUnique({
        where: { id: partModelId },
      })
      if (!model) {
        throw new NotFoundError(MESSAGES.partModelNotFound)
      }

      const compatibilities = await prisma.modelCompatibility.findMany({
        where: { partModelId },
        orderBy: { createdAt: 'desc' },
        include: {
          partModel: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true,
              brand: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
          },
          vehicleModel: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true,
              brand: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
      })

      return compatibilities as IModelCompatibilityWithRelations[]
    } catch (error) {
      logger.error('Error finding compatibilities by part model', {
        error,
        partModelId,
      })
      throw error
    }
  }

  /**
   * Obtener compatibilidades de un modelo de vehículo
   */
  async findByVehicleModel(
    vehicleModelId: string
  ): Promise<IModelCompatibilityWithRelations[]> {
    try {
      const model = await prisma.model.findUnique({
        where: { id: vehicleModelId },
      })
      if (!model) {
        throw new NotFoundError(MESSAGES.vehicleModelNotFound)
      }

      const compatibilities = await prisma.modelCompatibility.findMany({
        where: { vehicleModelId },
        orderBy: { createdAt: 'desc' },
        include: {
          partModel: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true,
              brand: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
          },
          vehicleModel: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true,
              brand: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
      })

      return compatibilities as IModelCompatibilityWithRelations[]
    } catch (error) {
      logger.error('Error finding compatibilities by vehicle model', {
        error,
        vehicleModelId,
      })
      throw error
    }
  }

  /**
   * Actualizar compatibilidad
   */
  async update(
    id: string,
    data: IUpdateCompatibilityInput,
    userId?: string
  ): Promise<IModelCompatibilityWithRelations> {
    try {
      // Verificar que existe
      await this.findById(id)

      const updateData: any = {}
      if (data.notes !== undefined) {
        updateData.notes = data.notes
      }
      if (data.isVerified !== undefined) {
        updateData.isVerified = data.isVerified
      }

      const compatibility = await prisma.modelCompatibility.update({
        where: { id },
        data: updateData,
        include: {
          partModel: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true,
              brand: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
          },
          vehicleModel: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true,
              brand: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
      })

      logger.info('Model compatibility updated', {
        compatibilityId: id,
        userId,
      })

      return compatibility as IModelCompatibilityWithRelations
    } catch (error) {
      logger.error('Error updating model compatibility', {
        error,
        id,
        data,
        userId,
      })
      throw error
    }
  }

  /**
   * Marcar compatibilidad como verificada
   */
  async verify(
    id: string,
    userId?: string
  ): Promise<IModelCompatibilityWithRelations> {
    try {
      const compatibility = await this.findById(id)

      if (compatibility.isVerified) {
        throw new BadRequestError('Esta compatibilidad ya está verificada')
      }

      const updated = await prisma.modelCompatibility.update({
        where: { id },
        data: { isVerified: true },
        include: {
          partModel: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true,
              brand: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
          },
          vehicleModel: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true,
              brand: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
      })

      logger.info('Model compatibility verified', {
        compatibilityId: id,
        userId,
      })

      return updated as IModelCompatibilityWithRelations
    } catch (error) {
      logger.error('Error verifying model compatibility', { error, id, userId })
      throw error
    }
  }

  /**
   * Eliminar compatibilidad
   */
  async delete(id: string, userId?: string): Promise<void> {
    try {
      await this.findById(id)

      await prisma.modelCompatibility.delete({
        where: { id },
      })

      logger.info('Model compatibility deleted', {
        compatibilityId: id,
        userId,
      })
    } catch (error) {
      logger.error('Error deleting model compatibility', { error, id, userId })
      throw error
    }
  }
}

export const modelCompatibilityService = new ModelCompatibilityService()
