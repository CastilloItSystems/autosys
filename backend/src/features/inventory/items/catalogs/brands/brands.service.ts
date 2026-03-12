// backend/src/features/inventory/items/catalogs/brands/brands.service.ts

import { PrismaClient, Prisma } from '../../../../../generated/prisma/client.js'
import {
  IBrandWithStats,
  ICreateBrandInput,
  IUpdateBrandInput,
  IBrandFilters,
  IBrandListResult,
  IBrandGroupedByType,
  BrandType,
  BRAND_TYPE_LABELS,
} from './brands.interface.js'
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
} from '../../../../../shared/utils/apiError.js'
import { PaginationHelper } from '../../../../../shared/utils/pagination.js'
import { INVENTORY_MESSAGES } from '../../../shared/constants/messages.js'
import { logger } from '../../../../../shared/utils/logger.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

const MSG = INVENTORY_MESSAGES.brand

const BRAND_INCLUDE = {
  _count: { select: { items: true, models: true } },
} as const

class BrandService {
  // -------------------------------------------------------------------------
  // CREATE
  // -------------------------------------------------------------------------

  async createBrand(
    empresaId: string,
    data: ICreateBrandInput,
    userId: string,
    db: PrismaClientType
  ): Promise<IBrandWithStats> {
    const code = data.code.toUpperCase()

    const existing = await (db as PrismaClient).brand.findFirst({
      where: { empresaId, code },
    })
    if (existing) throw new ConflictError(MSG.codeExists)

    const brand = await (db as PrismaClient).brand.create({
      data: {
        empresaId,
        code,
        name: data.name,
        type: data.type,
        isActive: data.isActive ?? true,
        ...(data.description != null ? { description: data.description } : {}),
      },
      include: BRAND_INCLUDE,
    })

    logger.info('Marca creada', { brandId: brand.id, code, empresaId, userId })

    return brand as unknown as IBrandWithStats
  }

  // -------------------------------------------------------------------------
  // READ
  // -------------------------------------------------------------------------

  async getBrandById(
    empresaId: string,
    id: string,
    db: PrismaClientType
  ): Promise<IBrandWithStats> {
    const brand = await (db as PrismaClient).brand.findFirst({
      where: { id, empresaId },
      include: BRAND_INCLUDE,
    })
    if (!brand) throw new NotFoundError(MSG.notFound)
    return brand as unknown as IBrandWithStats
  }

  async getBrands(
    empresaId: string,
    filters: IBrandFilters,
    db: PrismaClientType
  ): Promise<IBrandListResult> {
    const { search, type, isActive, page = 1, limit = 10 } = filters
    const {
      skip,
      take,
      page: validPage,
      limit: validLimit,
    } = PaginationHelper.validateAndParse({ page, limit })

    const where: Prisma.BrandWhereInput = { empresaId }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (type) where.type = type
    if (isActive !== undefined) where.isActive = isActive

    const [total, brands] = await Promise.all([
      (db as PrismaClient).brand.count({ where }),
      (db as PrismaClient).brand.findMany({
        where,
        include: BRAND_INCLUDE,
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
        skip,
        take,
      }),
    ])

    const meta = PaginationHelper.getMeta(validPage, validLimit, total)

    return {
      brands: brands as unknown as IBrandWithStats[],
      ...meta,
    }
  }

  async getBrandsGroupedByType(
    empresaId: string,
    filters: { search?: string; isActive?: boolean } = {},
    db: PrismaClientType
  ): Promise<IBrandGroupedByType[]> {
    const where: Prisma.BrandWhereInput = { empresaId }

    if (filters.search) {
      where.OR = [
        { code: { contains: filters.search, mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } },
      ]
    }
    if (filters.isActive !== undefined) where.isActive = filters.isActive

    const brands = await (db as PrismaClient).brand.findMany({
      where,
      include: BRAND_INCLUDE,
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    })

    const grouped: Record<BrandType, IBrandWithStats[]> = {
      VEHICLE: [],
      PART: [],
      BOTH: [],
    }
    for (const brand of brands as unknown as IBrandWithStats[]) {
      grouped[brand.type].push(brand)
    }

    const result: IBrandGroupedByType[] = []
    for (const type of ['VEHICLE', 'PART', 'BOTH'] as BrandType[]) {
      if (grouped[type].length > 0) {
        result.push({
          type,
          typeLabel: BRAND_TYPE_LABELS[type],
          brands: grouped[type],
          count: grouped[type].length,
        })
      }
    }

    return result
  }

  async getActiveBrands(
    empresaId: string,
    db: PrismaClientType,
    type?: BrandType
  ): Promise<IBrandWithStats[]> {
    const where: Prisma.BrandWhereInput = { empresaId, isActive: true }
    if (type) where.type = type

    const brands = await (db as PrismaClient).brand.findMany({
      where,
      include: BRAND_INCLUDE,
      orderBy: { name: 'asc' },
    })

    return brands as unknown as IBrandWithStats[]
  }

  async searchBrands(
    empresaId: string,
    query: string,
    db: PrismaClientType,
    type?: BrandType
  ): Promise<IBrandWithStats[]> {
    const where: Prisma.BrandWhereInput = {
      empresaId,
      isActive: true,
      OR: [
        { code: { contains: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } },
      ],
    }
    if (type) where.type = type

    const brands = await (db as PrismaClient).brand.findMany({
      where,
      include: BRAND_INCLUDE,
      take: 10,
      orderBy: { name: 'asc' },
    })

    return brands as unknown as IBrandWithStats[]
  }

  async getBrandStats(
    empresaId: string,
    db: PrismaClientType
  ): Promise<{
    total: number
    byType: Record<BrandType, number>
    active: number
    inactive: number
  }> {
    const [total, byType, active, inactive] = await Promise.all([
      (db as PrismaClient).brand.count({ where: { empresaId } }),
      (db as PrismaClient).brand.groupBy({
        by: ['type'],
        where: { empresaId },
        _count: true,
      }),
      (db as PrismaClient).brand.count({
        where: { empresaId, isActive: true },
      }),
      (db as PrismaClient).brand.count({
        where: { empresaId, isActive: false },
      }),
    ])

    const byTypeObj: Record<BrandType, number> = {
      VEHICLE: 0,
      PART: 0,
      BOTH: 0,
    }
    for (const item of byType as Array<{ type: BrandType; _count: number }>) {
      byTypeObj[item.type] = item._count
    }

    return { total, byType: byTypeObj, active, inactive }
  }

  // -------------------------------------------------------------------------
  // UPDATE
  // -------------------------------------------------------------------------

  async updateBrand(
    empresaId: string,
    id: string,
    data: IUpdateBrandInput,
    userId: string,
    db: PrismaClientType
  ): Promise<IBrandWithStats> {
    await this.getBrandById(empresaId, id, db) // throws 404

    if (data.code) {
      const conflict = await (db as PrismaClient).brand.findFirst({
        where: { empresaId, code: data.code.toUpperCase(), id: { not: id } },
      })
      if (conflict) throw new ConflictError(MSG.codeExists)
    }

    const updateData: Record<string, unknown> = {}
    if (data.code !== undefined) updateData.code = data.code.toUpperCase()
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined)
      updateData.description = data.description ?? null
    if (data.type !== undefined) updateData.type = data.type
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    const brand = await (db as PrismaClient).brand.update({
      where: { id },
      data: updateData as never,
      include: BRAND_INCLUDE,
    })

    logger.info('Marca actualizada', { brandId: id, empresaId, userId })

    return brand as unknown as IBrandWithStats
  }

  async toggleBrand(
    empresaId: string,
    id: string,
    userId: string,
    db: PrismaClientType
  ): Promise<IBrandWithStats> {
    const brand = await this.getBrandById(empresaId, id, db)

    const toggled = await (db as PrismaClient).brand.update({
      where: { id },
      data: { isActive: !brand.isActive },
      include: BRAND_INCLUDE,
    })

    logger.info('Estado de marca cambiado', {
      brandId: id,
      isActive: toggled.isActive,
      empresaId,
      userId,
    })

    return toggled as unknown as IBrandWithStats
  }

  async reactivateBrand(
    empresaId: string,
    id: string,
    userId: string,
    db: PrismaClientType
  ): Promise<IBrandWithStats> {
    await this.getBrandById(empresaId, id, db) // throws 404

    const brand = await (db as PrismaClient).brand.update({
      where: { id },
      data: { isActive: true },
      include: BRAND_INCLUDE,
    })

    logger.info('Marca reactivada', { brandId: id, empresaId, userId })

    return brand as unknown as IBrandWithStats
  }

  // -------------------------------------------------------------------------
  // DELETE
  // -------------------------------------------------------------------------

  async deleteBrand(
    empresaId: string,
    id: string,
    userId: string,
    db: PrismaClientType
  ): Promise<void> {
    await this.getBrandById(empresaId, id, db) // throws 404

    await (db as PrismaClient).brand.update({
      where: { id },
      data: { isActive: false },
    })

    logger.info('Marca eliminada (soft)', { brandId: id, empresaId, userId })
  }

  async deleteBrandPermanently(
    empresaId: string,
    id: string,
    userId: string,
    db: PrismaClientType
  ): Promise<void> {
    const brand = await this.getBrandById(empresaId, id, db)

    if (brand._count && (brand._count.items > 0 || brand._count.models > 0)) {
      throw new BadRequestError(MSG.hasItems)
    }

    await (db as PrismaClient).brand.delete({ where: { id } })

    logger.warn('Marca eliminada permanentemente', {
      brandId: id,
      empresaId,
      userId,
    })
  }
}

export default new BrandService()
