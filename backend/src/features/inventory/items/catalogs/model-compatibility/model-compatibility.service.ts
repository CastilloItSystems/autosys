// backend/src/features/inventory/items/catalogs/model-compatibility/model-compatibility.service.ts

import { PrismaClient, Prisma } from '../../../../../generated/prisma/client.js'
import { logger } from '../../../../../shared/utils/logger.js'
import {
  ConflictError,
  NotFoundError,
  BadRequestError,
} from '../../../../../shared/utils/apiError.js'
import { PaginationHelper } from '../../../../../shared/utils/pagination.js'
import {
  ICreateCompatibilityInput,
  IUpdateCompatibilityInput,
  ICompatibilityFilters,
  IModelCompatibilityWithRelations,
} from './model-compatibility.interface.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

const MESSAGES = {
  alreadyExists: 'La compatibilidad entre estos modelos ya existe',
  notFound: 'Compatibilidad no encontrada',
  partModelNotFound: 'Modelo de parte no encontrado',
  vehicleModelNotFound: 'Modelo de vehículo no encontrado',
  samePart: 'No se puede crear compatibilidad entre el mismo modelo',
  alreadyVerified: 'Esta compatibilidad ya está verificada',
}

const COMPAT_INCLUDE = {
  partModel: {
    select: {
      id: true,
      code: true,
      name: true,
      type: true,
      brand: { select: { id: true, code: true, name: true } },
    },
  },
  vehicleModel: {
    select: {
      id: true,
      code: true,
      name: true,
      type: true,
      brand: { select: { id: true, code: true, name: true } },
    },
  },
} as const

class ModelCompatibilityService {
  // -------------------------------------------------------------------------
  // CREATE
  // -------------------------------------------------------------------------

  async create(
    empresaId: string,
    data: ICreateCompatibilityInput,
    userId: string,
    db: PrismaClientType
  ): Promise<IModelCompatibilityWithRelations> {
    if (data.partModelId === data.vehicleModelId) {
      throw new BadRequestError(MESSAGES.samePart)
    }

    // Verificar que ambos modelos existen Y pertenecen a la empresa
    const [partModel, vehicleModel] = await Promise.all([
      (db as PrismaClient).model.findFirst({
        where: { id: data.partModelId, empresaId },
      }),
      (db as PrismaClient).model.findFirst({
        where: { id: data.vehicleModelId, empresaId },
      }),
    ])

    if (!partModel) throw new NotFoundError(MESSAGES.partModelNotFound)
    if (!vehicleModel) throw new NotFoundError(MESSAGES.vehicleModelNotFound)

    // Verificar unicidad (en ambas direcciones)
    const existing = await (db as PrismaClient).modelCompatibility.findFirst({
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
    if (existing) throw new ConflictError(MESSAGES.alreadyExists)

    const compatibility = await (db as PrismaClient).modelCompatibility.create({
      data: {
        partModelId: data.partModelId,
        vehicleModelId: data.vehicleModelId,
        notes: data.notes ?? null,
        isVerified: data.isVerified ?? false,
      },
      include: COMPAT_INCLUDE,
    })

    logger.info('Compatibilidad creada', {
      compatibilityId: compatibility.id,
      partModelId: data.partModelId,
      vehicleModelId: data.vehicleModelId,
      empresaId,
      userId,
    })

    return compatibility as unknown as IModelCompatibilityWithRelations
  }

  // -------------------------------------------------------------------------
  // READ
  // -------------------------------------------------------------------------

  async findAll(
    empresaId: string,
    filters: ICompatibilityFilters,
    page: number = 1,
    limit: number = 10,
    db: PrismaClientType
  ): Promise<{
    data: IModelCompatibilityWithRelations[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    const {
      skip,
      take,
      page: validPage,
      limit: validLimit,
    } = PaginationHelper.validateAndParse({ page, limit })

    // Tenant via relación con Model
    const where: Prisma.ModelCompatibilityWhereInput = {
      partModel: { empresaId },
    }

    if (filters.partModelId) where.partModelId = filters.partModelId
    if (filters.vehicleModelId) where.vehicleModelId = filters.vehicleModelId
    if (filters.isVerified !== undefined) where.isVerified = filters.isVerified

    const [total, compatibilities] = await Promise.all([
      (db as PrismaClient).modelCompatibility.count({ where }),
      (db as PrismaClient).modelCompatibility.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: COMPAT_INCLUDE,
      }),
    ])

    const meta = PaginationHelper.getMeta(validPage, validLimit, total)

    return {
      data: compatibilities as unknown as IModelCompatibilityWithRelations[],
      ...meta,
    }
  }

  async findById(
    empresaId: string,
    id: string,
    db: PrismaClientType
  ): Promise<IModelCompatibilityWithRelations> {
    const compatibility = await (
      db as PrismaClient
    ).modelCompatibility.findFirst({
      where: { id, partModel: { empresaId } },
      include: COMPAT_INCLUDE,
    })
    if (!compatibility) throw new NotFoundError(MESSAGES.notFound)
    return compatibility as unknown as IModelCompatibilityWithRelations
  }

  async findByPartModel(
    empresaId: string,
    partModelId: string,
    db: PrismaClientType
  ): Promise<IModelCompatibilityWithRelations[]> {
    const model = await (db as PrismaClient).model.findFirst({
      where: { id: partModelId, empresaId },
    })
    if (!model) throw new NotFoundError(MESSAGES.partModelNotFound)

    const compatibilities = await (
      db as PrismaClient
    ).modelCompatibility.findMany({
      where: { partModelId },
      orderBy: { createdAt: 'desc' },
      include: COMPAT_INCLUDE,
    })
    return compatibilities as unknown as IModelCompatibilityWithRelations[]
  }

  async findByVehicleModel(
    empresaId: string,
    vehicleModelId: string,
    db: PrismaClientType
  ): Promise<IModelCompatibilityWithRelations[]> {
    const model = await (db as PrismaClient).model.findFirst({
      where: { id: vehicleModelId, empresaId },
    })
    if (!model) throw new NotFoundError(MESSAGES.vehicleModelNotFound)

    const compatibilities = await (
      db as PrismaClient
    ).modelCompatibility.findMany({
      where: { vehicleModelId },
      orderBy: { createdAt: 'desc' },
      include: COMPAT_INCLUDE,
    })
    return compatibilities as unknown as IModelCompatibilityWithRelations[]
  }

  // -------------------------------------------------------------------------
  // UPDATE
  // -------------------------------------------------------------------------

  async update(
    empresaId: string,
    id: string,
    data: IUpdateCompatibilityInput,
    userId: string,
    db: PrismaClientType
  ): Promise<IModelCompatibilityWithRelations> {
    await this.findById(empresaId, id, db) // throws 404

    const updateData: Record<string, unknown> = {}
    if (data.notes !== undefined) updateData.notes = data.notes ?? null
    if (data.isVerified !== undefined) updateData.isVerified = data.isVerified

    const compatibility = await (db as PrismaClient).modelCompatibility.update({
      where: { id },
      data: updateData as never,
      include: COMPAT_INCLUDE,
    })

    logger.info('Compatibilidad actualizada', {
      compatibilityId: id,
      empresaId,
      userId,
    })
    return compatibility as unknown as IModelCompatibilityWithRelations
  }

  async verify(
    empresaId: string,
    id: string,
    userId: string,
    db: PrismaClientType
  ): Promise<IModelCompatibilityWithRelations> {
    const compatibility = await this.findById(empresaId, id, db)

    if (compatibility.isVerified)
      throw new BadRequestError(MESSAGES.alreadyVerified)

    const updated = await (db as PrismaClient).modelCompatibility.update({
      where: { id },
      data: { isVerified: true },
      include: COMPAT_INCLUDE,
    })

    logger.info('Compatibilidad verificada', {
      compatibilityId: id,
      empresaId,
      userId,
    })
    return updated as unknown as IModelCompatibilityWithRelations
  }

  // -------------------------------------------------------------------------
  // DELETE
  // -------------------------------------------------------------------------

  async delete(
    empresaId: string,
    id: string,
    userId: string,
    db: PrismaClientType
  ): Promise<void> {
    await this.findById(empresaId, id, db) // throws 404

    await (db as PrismaClient).modelCompatibility.delete({ where: { id } })

    logger.info('Compatibilidad eliminada', {
      compatibilityId: id,
      empresaId,
      userId,
    })
  }
}

export const modelCompatibilityService = new ModelCompatibilityService()
