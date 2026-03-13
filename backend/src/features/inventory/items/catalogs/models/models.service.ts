// backend/src/features/inventory/items/catalogs/models/models.service.ts

import { PrismaClient, Prisma } from '../../../../../generated/prisma/client.js'
import {
  ICreateModelInput,
  IUpdateModelInput,
  IModelFilters,
  IModelWithRelations,
  IModelGroupedByBrand,
} from './models.interface.js'
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from '../../../../../shared/utils/apiError.js'
import { PaginationHelper } from '../../../../../shared/utils/pagination.js'
import { INVENTORY_MESSAGES } from '../../../shared/constants/messages.js'
import { logger } from '../../../../../shared/utils/logger.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

const MSG = INVENTORY_MESSAGES.model

const MODEL_INCLUDE = {
  brand: { select: { id: true, code: true, name: true } },
  _count: { select: { items: true } },
} as const

class ModelService {
  // -------------------------------------------------------------------------
  // CREATE
  // -------------------------------------------------------------------------

  async create(
    empresaId: string,
    data: ICreateModelInput,
    userId: string,
    db: PrismaClientType
  ): Promise<IModelWithRelations> {
    // Verificar que la marca existe y pertenece a la empresa
    const brand = await (db as PrismaClient).brand.findFirst({
      where: { id: data.brandId, empresaId },
    })
    if (!brand) throw new NotFoundError('Marca no encontrada')
    if (!brand.isActive) throw new BadRequestError('La marca no está activa')

    // Verificar unicidad (empresaId + brandId + name + year + type + code)
    const existing = await (db as PrismaClient).model.findFirst({
      where: {
        empresaId,
        brandId: data.brandId,
        name: data.name,
        year: data.year ?? null,
        type: data.type ?? 'PART',
        code: data.code ?? null,
      },
    })
    if (existing) throw new ConflictError(MSG.alreadyExists)

    const model = await (db as PrismaClient).model.create({
      data: {
        empresaId,
        brandId: data.brandId,
        name: data.name,
        type: data.type ?? 'PART',
        isActive: data.isActive ?? true,
        code: data.code ?? null,
        year: data.year ?? null,
        description: data.description ?? null,
        ...(data.specifications != null
          ? { specifications: data.specifications }
          : {}),
      },
      include: MODEL_INCLUDE,
    })

    logger.info('Modelo creado', {
      modelId: model.id,
      brandId: model.brandId,
      empresaId,
      userId,
    })

    return model as unknown as IModelWithRelations
  }

  // -------------------------------------------------------------------------
  // READ
  // -------------------------------------------------------------------------

  async findAll(
    empresaId: string,
    filters: IModelFilters,
    page: number = 1,
    limit: number = 10,
    db: PrismaClientType
  ) {
    const {
      skip,
      take,
      page: validPage,
      limit: validLimit,
    } = PaginationHelper.validateAndParse({ page, limit })

    const where: Prisma.ModelWhereInput = { empresaId }

    if (filters.search)
      where.name = { contains: filters.search, mode: 'insensitive' }
    if (filters.brandId) where.brandId = filters.brandId
    if (filters.year !== undefined) where.year = filters.year
    if (filters.type !== undefined) where.type = filters.type
    if (filters.isActive !== undefined) where.isActive = filters.isActive

    const [total, models] = await Promise.all([
      (db as PrismaClient).model.count({ where }),
      (db as PrismaClient).model.findMany({
        where,
        skip,
        take,
        orderBy: [{ name: 'asc' }, { year: 'desc' }],
        include: MODEL_INCLUDE,
      }),
    ])

    const meta = PaginationHelper.getMeta(validPage, validLimit, total)
    return { models: models as unknown as IModelWithRelations[], ...meta }
  }

  async findById(
    empresaId: string,
    id: string,
    db: PrismaClientType
  ): Promise<IModelWithRelations> {
    const model = await (db as PrismaClient).model.findFirst({
      where: { id, empresaId },
      include: MODEL_INCLUDE,
    })
    if (!model) throw new NotFoundError(MSG.notFound)
    return model as unknown as IModelWithRelations
  }

  async findByBrand(
    empresaId: string,
    brandId: string,
    db: PrismaClientType
  ): Promise<IModelWithRelations[]> {
    const brand = await (db as PrismaClient).brand.findFirst({
      where: { id: brandId, empresaId },
    })
    if (!brand) throw new NotFoundError('Marca no encontrada')

    const models = await (db as PrismaClient).model.findMany({
      where: { empresaId, brandId },
      orderBy: [{ name: 'asc' }, { year: 'desc' }],
      include: MODEL_INCLUDE,
    })
    return models as unknown as IModelWithRelations[]
  }

  async findGroupedByBrand(
    empresaId: string,
    db: PrismaClientType
  ): Promise<IModelGroupedByBrand[]> {
    const brands = await (db as PrismaClient).brand.findMany({
      where: { empresaId, isActive: true },
      select: { id: true, code: true, name: true },
      orderBy: { name: 'asc' },
    })

    const grouped: IModelGroupedByBrand[] = []

    for (const brand of brands) {
      const models = await this.findByBrand(empresaId, brand.id, db)
      if (models.length > 0) {
        grouped.push({ brand, models, count: models.length })
      }
    }

    return grouped
  }

  async findByYear(
    empresaId: string,
    year: number,
    db: PrismaClientType
  ): Promise<IModelWithRelations[]> {
    const models = await (db as PrismaClient).model.findMany({
      where: { empresaId, year },
      orderBy: [{ brand: { name: 'asc' } }, { name: 'asc' }],
      include: MODEL_INCLUDE,
    })
    return models as unknown as IModelWithRelations[]
  }

  async findActive(
    empresaId: string,
    db: PrismaClientType,
    type?: 'VEHICLE' | 'PART'
  ): Promise<IModelWithRelations[]> {
    const where: Prisma.ModelWhereInput = { empresaId, isActive: true }
    if (type) where.type = type

    const models = await (db as PrismaClient).model.findMany({
      where,
      orderBy: [{ brand: { name: 'asc' } }, { name: 'asc' }, { year: 'desc' }],
      include: MODEL_INCLUDE,
    })
    return models as unknown as IModelWithRelations[]
  }

  async search(
    empresaId: string,
    term: string,
    db: PrismaClientType,
    limit: number = 10
  ): Promise<IModelWithRelations[]> {
    const models = await (db as PrismaClient).model.findMany({
      where: {
        empresaId,
        isActive: true,
        name: { contains: term, mode: 'insensitive' },
      },
      take: limit,
      orderBy: [{ brand: { name: 'asc' } }, { name: 'asc' }, { year: 'desc' }],
      include: MODEL_INCLUDE,
    })
    return models as unknown as IModelWithRelations[]
  }

  async getAvailableYears(
    empresaId: string,
    db: PrismaClientType
  ): Promise<number[]> {
    const models = await (db as PrismaClient).model.findMany({
      where: { empresaId, isActive: true, year: { not: null } },
      select: { year: true },
      distinct: ['year'],
      orderBy: { year: 'desc' },
    })
    return models.map((m) => m.year!).filter(Boolean)
  }

  // -------------------------------------------------------------------------
  // UPDATE
  // -------------------------------------------------------------------------

  async update(
    empresaId: string,
    id: string,
    data: IUpdateModelInput,
    userId: string,
    db: PrismaClientType
  ): Promise<IModelWithRelations> {
    const existing = await this.findById(empresaId, id, db)

    if (data.brandId) {
      const brand = await (db as PrismaClient).brand.findFirst({
        where: { id: data.brandId, empresaId },
      })
      if (!brand) throw new NotFoundError('Marca no encontrada')
      if (!brand.isActive) throw new BadRequestError('La marca no está activa')
    }

    // Verificar unicidad si cambia nombre, marca, año, tipo o código
    if (
      data.name !== undefined ||
      data.brandId ||
      data.year !== undefined ||
      data.type ||
      data.code !== undefined
    ) {
      const checkBrandId = data.brandId ?? existing.brandId
      const checkName = data.name ?? existing.name
      const checkYear = data.year !== undefined ? data.year : existing.year
      const checkType = data.type ?? existing.type
      const checkCode = data.code !== undefined ? data.code : existing.code

      const duplicate = await (db as PrismaClient).model.findFirst({
        where: {
          empresaId,
          brandId: checkBrandId,
          name: checkName,
          year: checkYear ?? null,
          type: checkType,
          code: checkCode ?? null,
          id: { not: id },
        },
      })
      if (duplicate) throw new ConflictError(MSG.alreadyExists)
    }

    const updateData: Record<string, unknown> = {}
    if (data.brandId !== undefined) updateData.brandId = data.brandId
    if (data.code !== undefined) updateData.code = data.code ?? null
    if (data.name !== undefined) updateData.name = data.name
    if (data.year !== undefined) updateData.year = data.year ?? null
    if (data.type !== undefined) updateData.type = data.type
    if (data.description !== undefined)
      updateData.description = data.description ?? null
    if (data.specifications !== undefined)
      updateData.specifications = data.specifications ?? null
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    const model = await (db as PrismaClient).model.update({
      where: { id },
      data: updateData as never,
      include: MODEL_INCLUDE,
    })

    logger.info('Modelo actualizado', { modelId: id, empresaId, userId })
    return model as unknown as IModelWithRelations
  }

  async toggleActive(
    empresaId: string,
    id: string,
    userId: string,
    db: PrismaClientType
  ): Promise<IModelWithRelations> {
    const model = await this.findById(empresaId, id, db)

    const updated = await (db as PrismaClient).model.update({
      where: { id },
      data: { isActive: !model.isActive },
      include: MODEL_INCLUDE,
    })

    logger.info('Estado de modelo cambiado', {
      modelId: id,
      isActive: updated.isActive,
      empresaId,
      userId,
    })
    return updated as unknown as IModelWithRelations
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
    const model = await this.findById(empresaId, id, db)

    if (model._count && model._count.items > 0)
      throw new BadRequestError(MSG.hasItems)

    await (db as PrismaClient).model.update({
      where: { id },
      data: { isActive: false },
    })

    logger.info('Modelo eliminado (soft)', { modelId: id, empresaId, userId })
  }

  async hardDelete(
    empresaId: string,
    id: string,
    userId: string,
    db: PrismaClientType
  ): Promise<void> {
    const model = await this.findById(empresaId, id, db)

    if (model._count && model._count.items > 0)
      throw new BadRequestError(MSG.hasItems)

    await (db as PrismaClient).model.delete({ where: { id } })

    logger.warn('Modelo eliminado permanentemente', {
      modelId: id,
      empresaId,
      userId,
    })
  }

  // -------------------------------------------------------------------------
  // BULK
  // -------------------------------------------------------------------------

  async bulkCreate(
    empresaId: string,
    models: ICreateModelInput[],
    userId: string,
    db: PrismaClientType
  ) {
    const results = {
      success: [] as IModelWithRelations[],
      errors: [] as Array<{ name: string; brandId: string; error: string }>,
    }

    for (const data of models) {
      try {
        const model = await this.create(empresaId, data, userId, db)
        results.success.push(model)
      } catch (error: unknown) {
        results.errors.push({
          name: data.name,
          brandId: data.brandId,
          error: (error as Error).message,
        })
      }
    }

    logger.info('Importación masiva de modelos completada', {
      total: models.length,
      success: results.success.length,
      errors: results.errors.length,
      empresaId,
      userId,
    })

    return results
  }
}

export default new ModelService()
