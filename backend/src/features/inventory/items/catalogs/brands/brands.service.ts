// backend/src/features/inventory/items/catalogs/brands/brands.service.ts

import prisma from '../../../../../services/prisma.service'
import {
  IBrand,
  IBrandWithStats,
  ICreateBrandInput,
  IUpdateBrandInput,
  IBrandFilters,
  IBrandListResult,
  IBrandGroupedByType,
  BrandType,
  BRAND_TYPE_LABELS,
} from './brands.interface'
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
} from '../../../../../shared/utils/ApiError'
import { PaginationHelper } from '../../../../../shared/utils/pagination'
import { INVENTORY_MESSAGES } from '../../../shared/constants/messages'
import { logger } from '../../../../../shared/utils/logger'

export class BrandService {
  // ============================================
  // CREATE
  // ============================================
  async createBrand(data: ICreateBrandInput): Promise<IBrandWithStats> {
    // Verificar si el código ya existe
    const existingBrand = await prisma.brand.findUnique({
      where: { code: data.code },
    })

    if (existingBrand) {
      throw new ConflictError(INVENTORY_MESSAGES.brand.codeExists)
    }

    const brand = await prisma.brand.create({
      data,
      include: {
        _count: {
          select: {
            items: true,
            models: true,
          },
        },
      },
    })

    logger.info('Brand created', { brandId: brand.id, code: brand.code })

    return brand
  }

  // ============================================
  // GET BY ID
  // ============================================
  async getBrandById(id: string): Promise<IBrandWithStats> {
    const brand = await prisma.brand.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            items: true,
            models: true,
          },
        },
      },
    })

    if (!brand) {
      throw new NotFoundError(INVENTORY_MESSAGES.brand.notFound)
    }

    return brand
  }

  // ============================================
  // GET ALL CON FILTROS Y PAGINACIÓN
  // ============================================
  async getBrands(filters: IBrandFilters): Promise<IBrandListResult> {
    const { search, type, isActive, page = 1, limit = 10 } = filters

    const where: any = {}

    // Filtro de búsqueda
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Filtro por tipo
    if (type) {
      where.type = type
    }

    // Filtro por estado
    if (isActive !== undefined) {
      where.isActive = isActive
    }

    const {
      skip,
      take,
      page: validPage,
      limit: validLimit,
    } = PaginationHelper.validateAndParse({ page, limit })

    const [brands, total] = await Promise.all([
      prisma.brand.findMany({
        where,
        include: {
          _count: {
            select: {
              items: true,
              models: true,
            },
          },
        },
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
        skip,
        take,
      }),
      prisma.brand.count({ where }),
    ])

    const meta = PaginationHelper.getMeta(validPage, validLimit, total)

    return {
      brands,
      ...meta,
    }
  }

  // ============================================
  // GET ALL AGRUPADO POR TIPO
  // ============================================
  async getBrandsGroupedByType(filters?: {
    search?: string
    isActive?: boolean
  }): Promise<IBrandGroupedByType[]> {
    const where: any = {}

    if (filters?.search) {
      where.OR = [
        { code: { contains: filters.search, mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive
    }

    const brands = await prisma.brand.findMany({
      where,
      include: {
        _count: {
          select: {
            items: true,
            models: true,
          },
        },
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    })

    // Agrupar por tipo
    const grouped: Record<BrandType, IBrandWithStats[]> = {
      VEHICLE: [],
      PART: [],
      BOTH: [],
    }

    brands.forEach((brand: IBrandWithStats) => {
      grouped[brand.type].push(brand)
    })

    // Convertir a array de grupos
    const result: IBrandGroupedByType[] = []

    ;(['VEHICLE', 'PART', 'BOTH'] as BrandType[]).forEach((type) => {
      if (grouped[type].length > 0) {
        result.push({
          type,
          typeLabel: BRAND_TYPE_LABELS[type],
          brands: grouped[type],
          count: grouped[type].length,
        })
      }
    })

    return result
  }

  // ============================================
  // UPDATE
  // ============================================
  async updateBrand(
    id: string,
    data: IUpdateBrandInput
  ): Promise<IBrandWithStats> {
    // Verificar que existe
    const existingBrand = await prisma.brand.findUnique({
      where: { id },
    })

    if (!existingBrand) {
      throw new NotFoundError(INVENTORY_MESSAGES.brand.notFound)
    }

    // Si se cambia el código, verificar que no exista otro con ese código
    if (data.code && data.code !== existingBrand.code) {
      const brandWithCode = await prisma.brand.findUnique({
        where: { code: data.code },
      })

      if (brandWithCode) {
        throw new ConflictError(INVENTORY_MESSAGES.brand.codeExists)
      }
    }

    const updatedBrand = await prisma.brand.update({
      where: { id },
      data,
      include: {
        _count: {
          select: {
            items: true,
            models: true,
          },
        },
      },
    })

    logger.info('Brand updated', { brandId: id })

    return updatedBrand
  }

  // ============================================
  // DELETE (SOFT) - Desactivar
  // ============================================
  async deleteBrand(id: string): Promise<void> {
    const brand = await prisma.brand.findUnique({
      where: { id },
    })

    if (!brand) {
      throw new NotFoundError(INVENTORY_MESSAGES.brand.notFound)
    }

    await prisma.brand.update({
      where: { id },
      data: { isActive: false },
    })

    logger.info('Brand soft deleted', { brandId: id })
  }

  // ============================================
  // DELETE (HARD) - Eliminación permanente
  // ============================================
  async deleteBrandPermanently(id: string): Promise<void> {
    const brand = await prisma.brand.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            items: true,
            models: true,
          },
        },
      },
    })

    if (!brand) {
      throw new NotFoundError(INVENTORY_MESSAGES.brand.notFound)
    }

    // Verificar que no tenga relaciones
    if (brand._count.items > 0 || brand._count.models > 0) {
      throw new BadRequestError(INVENTORY_MESSAGES.brand.hasItems)
    }

    await prisma.brand.delete({
      where: { id },
    })

    logger.info('Brand hard deleted', { brandId: id })
  }

  // ============================================
  // REACTIVAR MARCA
  // ============================================
  async reactivateBrand(id: string): Promise<IBrandWithStats> {
    const brand = await prisma.brand.findUnique({
      where: { id },
    })

    if (!brand) {
      throw new NotFoundError(INVENTORY_MESSAGES.brand.notFound)
    }

    const reactivated = await prisma.brand.update({
      where: { id },
      data: { isActive: true },
      include: {
        _count: {
          select: {
            items: true,
            models: true,
          },
        },
      },
    })

    logger.info('Brand reactivated', { brandId: id })

    return reactivated
  }

  // ============================================
  // GET ESTADÍSTICAS GENERALES
  // ============================================
  async getBrandStats(): Promise<{
    total: number
    byType: Record<BrandType, number>
    active: number
    inactive: number
  }> {
    const [total, byType, active, inactive] = await Promise.all([
      prisma.brand.count(),
      prisma.brand.groupBy({
        by: ['type'],
        _count: true,
      }),
      prisma.brand.count({ where: { isActive: true } }),
      prisma.brand.count({ where: { isActive: false } }),
    ])

    const byTypeObj: Record<BrandType, number> = {
      VEHICLE: 0,
      PART: 0,
      BOTH: 0,
    }

    byType.forEach((item: { type: BrandType; _count: number }) => {
      byTypeObj[item.type] = item._count
    })

    return {
      total,
      byType: byTypeObj,
      active,
      inactive,
    }
  }

  // ============================================
  // BUSCAR MARCAS ACTIVAS (PARA SELECTS)
  // ============================================
  async getActiveBrands(type?: BrandType): Promise<IBrandWithStats[]> {
    const where: any = { isActive: true }

    if (type) {
      where.type = type
    }

    const brands = await prisma.brand.findMany({
      where,
      include: {
        _count: {
          select: {
            items: true,
            models: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return brands
  }

  // ============================================
  // VERIFICAR SI EXISTE POR CODE
  // ============================================
  async existsByCode(code: string, excludeId?: string): Promise<boolean> {
    const where: any = { code }

    if (excludeId) {
      where.id = { not: excludeId }
    }

    const count = await prisma.brand.count({ where })
    return count > 0
  }

  // ============================================
  // BUSCAR POR NOMBRE O CÓDIGO
  // ============================================
  async searchBrands(
    query: string,
    type?: BrandType
  ): Promise<IBrandWithStats[]> {
    const where: any = {
      isActive: true,
      OR: [
        { code: { contains: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } },
      ],
    }

    if (type) {
      where.type = type
    }

    const brands = await prisma.brand.findMany({
      where,
      include: {
        _count: {
          select: {
            items: true,
            models: true,
          },
        },
      },
      take: 10,
      orderBy: { name: 'asc' },
    })

    return brands
  }
}
