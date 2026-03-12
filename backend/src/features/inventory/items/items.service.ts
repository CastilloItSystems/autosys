// backend/src/features/inventory/items/items.service.ts

import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import {
  ICreateItemInput,
  IUpdateItemInput,
  IItemFilters,
  IItemWithRelations,
} from './items.interface.js'
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from '../../../shared/utils/apiError.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import { INVENTORY_MESSAGES } from '../shared/constants/messages.js'
import { logger } from '../../../shared/utils/logger.js'
import { LocationValidator } from '../shared/utils/locationValidator.js'
import { PriceCalculator } from '../shared/utils/priceCalculator.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

const MSG = INVENTORY_MESSAGES.item

// ---------------------------------------------------------------------------
// Includes reutilizables
// ---------------------------------------------------------------------------

const BASE_INCLUDE = {
  brand: true,
  category: true,
  model: true,
  unit: true,
  images: { orderBy: { order: 'asc' as const } },
  _count: { select: { stocks: true, movements: true, images: true } },
} as const

const FULL_INCLUDE = {
  ...BASE_INCLUDE,
  stocks: { include: { warehouse: true } },
} as const

const LIST_INCLUDE = {
  ...BASE_INCLUDE,
  stocks: {
    select: {
      quantityReal: true,
      quantityReserved: true,
      quantityAvailable: true,
    },
  },
} as const

const SEARCH_INCLUDE = {
  brand: true,
  category: true,
  model: true,
  unit: true,
  images: { where: { isPrimary: true }, take: 1 },
  stocks: { select: { quantityAvailable: true } },
} as const

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class ItemService {
  // -------------------------------------------------------------------------
  // CREATE
  // -------------------------------------------------------------------------

  async create(
    empresaId: string,
    data: ICreateItemInput,
    userId: string,
    db: PrismaClientType
  ): Promise<IItemWithRelations> {
    const sku = data.sku.toUpperCase()

    const existingSku = await (db as PrismaClient).item.findFirst({
      where: { empresaId, sku },
    })
    if (existingSku) throw new ConflictError(MSG.skuExists)

    if (data.barcode) {
      const existingBarcode = await (db as PrismaClient).item.findFirst({
        where: { empresaId, barcode: data.barcode },
      })
      if (existingBarcode) throw new ConflictError(MSG.barcodeExists)
    }

    // Validate catalog relations belong to empresa
    const [brand, category, unit] = await Promise.all([
      (db as PrismaClient).brand.findFirst({
        where: { id: data.brandId, empresaId },
      }),
      (db as PrismaClient).category.findFirst({
        where: { id: data.categoryId, empresaId },
      }),
      (db as PrismaClient).unit.findFirst({
        where: { id: data.unitId, empresaId },
      }),
    ])

    if (!brand) throw new NotFoundError('Marca no encontrada')
    if (!brand.isActive) throw new BadRequestError('La marca no está activa')
    if (!category) throw new NotFoundError('Categoría no encontrada')
    if (!category.isActive)
      throw new BadRequestError('La categoría no está activa')
    if (!unit) throw new NotFoundError('Unidad no encontrada')

    if (data.modelId) {
      const model = await (db as PrismaClient).model.findFirst({
        where: { id: data.modelId, empresaId },
      })
      if (!model) throw new NotFoundError('Modelo no encontrado')
      if (model.brandId !== data.brandId) {
        throw new BadRequestError(
          'El modelo no pertenece a la marca seleccionada'
        )
      }
    }

    if (data.location && !LocationValidator.isValid(data.location)) {
      throw new BadRequestError(MSG.invalidLocation)
    }

    if (data.salePrice < data.costPrice) {
      throw new BadRequestError(
        'El precio de venta debe ser mayor o igual al precio de costo'
      )
    }

    const item = await (db as PrismaClient).item.create({
      data: {
        empresaId,
        sku,
        name: data.name,
        brandId: data.brandId,
        categoryId: data.categoryId,
        unitId: data.unitId,
        costPrice: data.costPrice as never,
        salePrice: data.salePrice as never,
        minStock: data.minStock ?? 5,
        maxStock: data.maxStock ?? 100,
        reorderPoint: data.reorderPoint ?? 10,
        isActive: data.isActive ?? true,
        isSerialized: data.isSerialized ?? false,
        hasBatch: data.hasBatch ?? false,
        hasExpiry: data.hasExpiry ?? false,
        allowNegativeStock: data.allowNegativeStock ?? false,
        tags: data.tags ?? [],
        historial: {
          action: 'CREATE',
          userId,
          timestamp: new Date().toISOString(),
        } as never,
        ...(data.barcode != null ? { barcode: data.barcode } : {}),
        ...(data.description != null ? { description: data.description } : {}),
        ...(data.modelId != null ? { modelId: data.modelId } : {}),
        ...(data.location != null
          ? { location: data.location.toUpperCase() }
          : {}),
        ...(data.wholesalePrice != null
          ? { wholesalePrice: data.wholesalePrice as never }
          : {}),
        ...(data.technicalSpecs != null
          ? { technicalSpecs: data.technicalSpecs as never }
          : {}),
      },
      include: BASE_INCLUDE,
    })

    logger.info('Item creado', { itemId: item.id, sku, empresaId, userId })

    return item as unknown as IItemWithRelations
  }

  // -------------------------------------------------------------------------
  // READ
  // -------------------------------------------------------------------------

  async findById(
    empresaId: string,
    id: string,
    includeStock: boolean,
    db: PrismaClientType
  ): Promise<IItemWithRelations> {
    const item = await (db as PrismaClient).item.findFirst({
      where: { id, empresaId },
      include: includeStock ? FULL_INCLUDE : BASE_INCLUDE,
    })
    if (!item) throw new NotFoundError(MSG.notFound)
    return item as unknown as IItemWithRelations
  }

  async findBySku(
    empresaId: string,
    sku: string,
    db: PrismaClientType
  ): Promise<IItemWithRelations | null> {
    const item = await (db as PrismaClient).item.findFirst({
      where: { empresaId, sku: sku.toUpperCase() },
      include: FULL_INCLUDE,
    })
    return item as unknown as IItemWithRelations | null
  }

  async findByBarcode(
    empresaId: string,
    barcode: string,
    db: PrismaClientType
  ): Promise<IItemWithRelations | null> {
    const item = await (db as PrismaClient).item.findFirst({
      where: { empresaId, barcode },
      include: FULL_INCLUDE,
    })
    return item as unknown as IItemWithRelations | null
  }

  async findAll(
    empresaId: string,
    filters: IItemFilters = {},
    page = 1,
    limit = 10,
    sortBy = 'name',
    sortOrder: 'asc' | 'desc' = 'asc',
    db: PrismaClientType
  ): Promise<{
    items: IItemWithRelations[]
    page: number
    limit: number
    total: number
    totalPages: number
  }> {
    const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

    const SORT_WHITELIST = new Set([
      'name',
      'sku',
      'createdAt',
      'costPrice',
      'salePrice',
    ])
    const orderField = SORT_WHITELIST.has(sortBy) ? sortBy : 'name'

    const where: Prisma.ItemWhereInput = { empresaId }

    if (filters.search) {
      where.OR = [
        { sku: { contains: filters.search, mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } },
        { barcode: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { tags: { has: filters.search.toLowerCase() } },
      ]
    }

    if (filters.brandId) where.brandId = filters.brandId
    if (filters.categoryId) where.categoryId = filters.categoryId
    if (filters.modelId) where.modelId = filters.modelId
    if (filters.isActive !== undefined) where.isActive = filters.isActive
    if (filters.tags?.length) {
      where.tags = { hasSome: filters.tags.map((t) => t.toLowerCase()) }
    }
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.salePrice = {}
      if (filters.minPrice !== undefined)
        (where.salePrice as Prisma.DecimalFilter).gte =
          filters.minPrice as never
      if (filters.maxPrice !== undefined)
        (where.salePrice as Prisma.DecimalFilter).lte =
          filters.maxPrice as never
    }

    const [total, items] = await Promise.all([
      (db as PrismaClient).item.count({ where }),
      (db as PrismaClient).item.findMany({
        where,
        skip,
        take,
        orderBy: { [orderField]: sortOrder },
        include: LIST_INCLUDE,
      }),
    ])

    const meta = PaginationHelper.getMeta(page, limit, total)

    return {
      items: items as unknown as IItemWithRelations[],
      page: meta.page,
      limit: meta.limit,
      total: meta.total,
      totalPages: meta.totalPages,
    }
  }

  async findActive(
    empresaId: string,
    limit: number,
    db: PrismaClientType
  ): Promise<IItemWithRelations[]> {
    const items = await (db as PrismaClient).item.findMany({
      where: { empresaId, isActive: true },
      take: limit,
      orderBy: { name: 'asc' },
      include: FULL_INCLUDE,
    })
    return items as unknown as IItemWithRelations[]
  }

  async search(
    empresaId: string,
    term: string,
    limit: number,
    db: PrismaClientType
  ): Promise<IItemWithRelations[]> {
    const items = await (db as PrismaClient).item.findMany({
      where: {
        empresaId,
        isActive: true,
        OR: [
          { sku: { contains: term, mode: 'insensitive' } },
          { name: { contains: term, mode: 'insensitive' } },
          { barcode: { contains: term, mode: 'insensitive' } },
          { tags: { has: term.toLowerCase() } },
        ],
      },
      take: limit,
      orderBy: { name: 'asc' },
      include: SEARCH_INCLUDE,
    })
    return items as unknown as IItemWithRelations[]
  }

  async findLowStock(
    empresaId: string,
    db: PrismaClientType,
    warehouseId?: string
  ): Promise<IItemWithRelations[]> {
    const items = await (db as PrismaClient).item.findMany({
      where: { empresaId, isActive: true },
      include: {
        brand: true,
        category: true,
        unit: true,
        images: { where: { isPrimary: true }, take: 1 },
        stocks: warehouseId
          ? { where: { warehouseId }, include: { warehouse: true } }
          : { include: { warehouse: true } },
      },
    })

    return items.filter((item) => {
      const totalAvailable = (
        item.stocks as Array<{ quantityAvailable: number }>
      ).reduce((sum, s) => sum + s.quantityAvailable, 0)
      return totalAvailable <= item.minStock
    }) as unknown as IItemWithRelations[]
  }

  async findOutOfStock(
    empresaId: string,
    db: PrismaClientType,
    warehouseId?: string
  ): Promise<IItemWithRelations[]> {
    const items = await (db as PrismaClient).item.findMany({
      where: { empresaId, isActive: true },
      include: {
        brand: true,
        category: true,
        unit: true,
        images: { where: { isPrimary: true }, take: 1 },
        stocks: warehouseId
          ? { where: { warehouseId }, include: { warehouse: true } }
          : { include: { warehouse: true } },
      },
    })

    return items.filter((item) => {
      const totalAvailable = (
        item.stocks as Array<{ quantityAvailable: number }>
      ).reduce((sum, s) => sum + s.quantityAvailable, 0)
      return totalAvailable === 0
    }) as unknown as IItemWithRelations[]
  }

  async findByCategory(
    empresaId: string,
    categoryId: string,
    includeSubcategories: boolean,
    db: PrismaClientType
  ): Promise<IItemWithRelations[]> {
    const category = await (db as PrismaClient).category.findFirst({
      where: { id: categoryId, empresaId },
    })
    if (!category) throw new NotFoundError('Categoría no encontrada')

    const categoryIds = [categoryId]
    if (includeSubcategories) {
      const children = await (db as PrismaClient).category.findMany({
        where: { empresaId, parentId: categoryId },
        select: { id: true },
      })
      categoryIds.push(...children.map((c) => c.id))
    }

    const items = await (db as PrismaClient).item.findMany({
      where: { empresaId, categoryId: { in: categoryIds }, isActive: true },
      orderBy: { name: 'asc' },
      include: FULL_INCLUDE,
    })

    return items as unknown as IItemWithRelations[]
  }

  // -------------------------------------------------------------------------
  // UPDATE
  // -------------------------------------------------------------------------

  async update(
    empresaId: string,
    id: string,
    data: IUpdateItemInput,
    userId: string,
    db: PrismaClientType
  ): Promise<IItemWithRelations> {
    const existing = await this.findById(empresaId, id, false, db)

    if (data.sku && data.sku !== existing.sku) {
      const existingSku = await (db as PrismaClient).item.findFirst({
        where: { empresaId, sku: data.sku.toUpperCase(), id: { not: id } },
      })
      if (existingSku) throw new ConflictError(MSG.skuExists)
    }

    if (data.barcode && data.barcode !== existing.barcode) {
      const existingBarcode = await (db as PrismaClient).item.findFirst({
        where: { empresaId, barcode: data.barcode, id: { not: id } },
      })
      if (existingBarcode) throw new ConflictError(MSG.barcodeExists)
    }

    const updateData: Record<string, unknown> = {}
    if (data.sku !== undefined) updateData.sku = data.sku.toUpperCase()
    if (data.barcode !== undefined) updateData.barcode = data.barcode ?? null
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined)
      updateData.description = data.description ?? null
    if (data.brandId !== undefined) updateData.brandId = data.brandId
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId
    if (data.modelId !== undefined) updateData.modelId = data.modelId ?? null
    if (data.unitId !== undefined) updateData.unitId = data.unitId
    if (data.location !== undefined)
      updateData.location = data.location?.toUpperCase() ?? null
    if (data.costPrice !== undefined) updateData.costPrice = data.costPrice
    if (data.salePrice !== undefined) updateData.salePrice = data.salePrice
    if (data.wholesalePrice !== undefined)
      updateData.wholesalePrice = data.wholesalePrice ?? null
    if (data.minStock !== undefined) updateData.minStock = data.minStock
    if (data.maxStock !== undefined) updateData.maxStock = data.maxStock ?? null
    if (data.reorderPoint !== undefined)
      updateData.reorderPoint = data.reorderPoint
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.isSerialized !== undefined)
      updateData.isSerialized = data.isSerialized
    if (data.hasBatch !== undefined) updateData.hasBatch = data.hasBatch
    if (data.hasExpiry !== undefined) updateData.hasExpiry = data.hasExpiry
    if (data.allowNegativeStock !== undefined)
      updateData.allowNegativeStock = data.allowNegativeStock
    if (data.technicalSpecs !== undefined)
      updateData.technicalSpecs = data.technicalSpecs ?? null
    if (data.tags !== undefined) updateData.tags = data.tags

    updateData.historial = {
      action: 'UPDATE',
      userId,
      timestamp: new Date().toISOString(),
    }

    const result = await (db as PrismaClient).item.updateMany({
      where: { id, empresaId },
      data: updateData as never,
    })

    if (result.count === 0) throw new NotFoundError(MSG.notFound)

    return this.findById(empresaId, id, true, db)
  }

  async updatePricing(
    empresaId: string,
    id: string,
    data: {
      costPrice?: number
      salePrice?: number
      wholesalePrice?: number
      applyMargin?: boolean
      marginPercentage?: number
    },
    userId: string,
    db: PrismaClientType
  ): Promise<IItemWithRelations> {
    const item = await this.findById(empresaId, id, false, db)

    let costPrice =
      data.costPrice ??
      Number((item as never as Record<string, unknown>).costPrice)
    let salePrice =
      data.salePrice ??
      Number((item as never as Record<string, unknown>).salePrice)
    const wholesalePrice =
      data.wholesalePrice ??
      Number((item as never as Record<string, unknown>).wholesalePrice ?? 0)

    if (data.applyMargin && data.marginPercentage !== undefined) {
      salePrice = PriceCalculator.calculateSalePriceWithMargin(
        costPrice,
        data.marginPercentage
      )
    }

    if (salePrice < costPrice) {
      throw new BadRequestError(
        'El precio de venta debe ser mayor o igual al precio de costo'
      )
    }

    await (db as PrismaClient).item.updateMany({
      where: { id, empresaId },
      data: {
        costPrice: costPrice as never,
        salePrice: salePrice as never,
        wholesalePrice: wholesalePrice as never,
        historial: {
          action: 'UPDATE_PRICING',
          userId,
          timestamp: new Date().toISOString(),
          newPrices: { costPrice, salePrice, wholesalePrice },
        } as never,
      },
    })

    return this.findById(empresaId, id, true, db)
  }

  async toggleActive(
    empresaId: string,
    id: string,
    userId: string,
    db: PrismaClientType
  ): Promise<IItemWithRelations> {
    const item = await this.findById(empresaId, id, false, db)
    return this.update(empresaId, id, { isActive: !item.isActive }, userId, db)
  }

  // -------------------------------------------------------------------------
  // BULK
  // -------------------------------------------------------------------------

  async bulkUpdate(
    empresaId: string,
    itemIds: string[],
    updates: {
      categoryId?: string
      isActive?: boolean
      tags?: string[]
      applyPriceIncrease?: number
    },
    userId: string,
    db: PrismaClientType
  ): Promise<{
    success: Array<{ itemId: string }>
    errors: Array<{ itemId: string; error: string }>
  }> {
    const results: {
      success: Array<{ itemId: string }>
      errors: Array<{ itemId: string; error: string }>
    } = { success: [], errors: [] }

    for (const itemId of itemIds) {
      try {
        const item = await this.findById(empresaId, itemId, false, db)

        const updateData: IUpdateItemInput = {}
        if (updates.categoryId !== undefined)
          updateData.categoryId = updates.categoryId
        if (updates.isActive !== undefined)
          updateData.isActive = updates.isActive
        if (updates.tags !== undefined)
          updateData.tags = updates.tags.map((t) => t.toLowerCase())

        if (updates.applyPriceIncrease !== undefined) {
          const inc = updates.applyPriceIncrease / 100
          updateData.costPrice =
            Number((item as never as Record<string, unknown>).costPrice) *
            (1 + inc)
          updateData.salePrice =
            Number((item as never as Record<string, unknown>).salePrice) *
            (1 + inc)
        }

        await this.update(empresaId, itemId, updateData, userId, db)
        results.success.push({ itemId })
      } catch (error: unknown) {
        results.errors.push({
          itemId,
          error: error instanceof Error ? error.message : 'Error desconocido',
        })
      }
    }

    return results
  }

  async bulkCreate(
    empresaId: string,
    items: ICreateItemInput[],
    userId: string,
    db: PrismaClientType
  ): Promise<{
    success: IItemWithRelations[]
    errors: Array<{ sku: string; name: string; error: string }>
  }> {
    const results: {
      success: IItemWithRelations[]
      errors: Array<{ sku: string; name: string; error: string }>
    } = { success: [], errors: [] }

    for (const itemData of items) {
      try {
        const item = await this.create(empresaId, itemData, userId, db)
        results.success.push(item)
      } catch (error: unknown) {
        results.errors.push({
          sku: itemData.sku,
          name: itemData.name,
          error: error instanceof Error ? error.message : 'Error desconocido',
        })
      }
    }

    return results
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
    const result = await (db as PrismaClient).item.updateMany({
      where: { id, empresaId },
      data: {
        isActive: false,
        historial: {
          action: 'DELETE',
          userId,
          timestamp: new Date().toISOString(),
        } as never,
      },
    })
    if (result.count === 0) throw new NotFoundError(MSG.notFound)
  }

  async hardDelete(
    empresaId: string,
    id: string,
    userId: string,
    db: PrismaClientType
  ): Promise<void> {
    const item = await (db as PrismaClient).item.findFirst({
      where: { id, empresaId },
      include: { _count: { select: { movements: true, stocks: true } } },
    })
    if (!item) throw new NotFoundError(MSG.notFound)

    if (item._count.movements > 0) throw new BadRequestError(MSG.hasMovements)

    const activeStock = await (db as PrismaClient).stock.count({
      where: { itemId: id, quantityReal: { gt: 0 } },
    })
    if (activeStock > 0) throw new BadRequestError(MSG.hasStock)

    await (db as PrismaClient).itemImage.deleteMany({ where: { itemId: id } })

    const deleted = await (db as PrismaClient).item.deleteMany({
      where: { id, empresaId },
    })
    if (deleted.count === 0) throw new NotFoundError(MSG.notFound)

    logger.warn('Item eliminado permanentemente', {
      itemId: id,
      empresaId,
      userId,
    })
  }

  // -------------------------------------------------------------------------
  // MISC
  // -------------------------------------------------------------------------

  generateSKU(categoryCode: string, brandCode: string): string {
    return `${categoryCode}-${brandCode}-${Date.now().toString().slice(-6)}`
  }

  async getHistory(
    empresaId: string,
    id: string,
    db: PrismaClientType
  ): Promise<unknown[]> {
    const item = await (db as PrismaClient).item.findFirst({
      where: { id, empresaId },
      select: { historial: true },
    })
    if (!item) throw new NotFoundError(MSG.notFound)

    const historial = item.historial as unknown
    return Array.isArray(historial) ? historial : []
  }

  async getStats(empresaId: string, id: string, db: PrismaClientType) {
    const item = await this.findById(empresaId, id, true, db)
    const raw = item as unknown as Record<string, unknown>
    const stocks = (raw.stocks as Array<Record<string, number>>) ?? []

    const totalStock = stocks.reduce((sum, s) => sum + (s.quantityReal ?? 0), 0)
    const availableStock = stocks.reduce(
      (sum, s) => sum + (s.quantityAvailable ?? 0),
      0
    )
    const reservedStock = stocks.reduce(
      (sum, s) => sum + (s.quantityReserved ?? 0),
      0
    )

    const [recentMovements, totalMovements, lastSale, totalSales] =
      await Promise.all([
        (db as PrismaClient).movement.findMany({
          where: { itemId: id },
          take: 10,
          orderBy: { movementDate: 'desc' },
        }),
        (db as PrismaClient).movement.count({ where: { itemId: id } }),
        (db as PrismaClient).movement.findFirst({
          where: { itemId: id, type: 'SALE' as never },
          orderBy: { movementDate: 'desc' },
        }),
        (db as PrismaClient).movement.count({
          where: { itemId: id, type: 'SALE' as never },
        }),
      ])

    const margin = PriceCalculator.calculateMargin(
      Number(raw.costPrice),
      Number(raw.salePrice)
    )

    return {
      item: { id: raw.id, sku: raw.sku, name: raw.name },
      stock: {
        total: totalStock,
        available: availableStock,
        reserved: reservedStock,
      },
      pricing: {
        costPrice: Number(raw.costPrice),
        salePrice: Number(raw.salePrice),
        wholesalePrice: raw.wholesalePrice ? Number(raw.wholesalePrice) : null,
        margin,
      },
      movements: {
        total: totalMovements,
        recent: recentMovements,
        lastSale,
        totalSales,
      },
    }
  }

  async getRelatedItems(
    empresaId: string,
    id: string,
    limit: number,
    db: PrismaClientType
  ): Promise<IItemWithRelations[]> {
    const item = await this.findById(empresaId, id, false, db)
    const raw = item as unknown as Record<string, unknown>

    const related = await (db as PrismaClient).item.findMany({
      where: {
        empresaId,
        id: { not: id },
        isActive: true,
        OR: [
          { categoryId: raw.categoryId as string },
          { brandId: raw.brandId as string },
          ...(raw.modelId ? [{ modelId: raw.modelId as string }] : []),
        ],
      },
      take: limit,
      orderBy: { name: 'asc' },
      include: SEARCH_INCLUDE,
    })

    return related as unknown as IItemWithRelations[]
  }

  async duplicate(
    empresaId: string,
    id: string,
    newSku: string,
    userId: string,
    db: PrismaClientType
  ): Promise<IItemWithRelations> {
    const original = await this.findById(empresaId, id, false, db)
    const raw = original as unknown as Record<string, unknown>

    const existingSku = await (db as PrismaClient).item.findFirst({
      where: { empresaId, sku: newSku.toUpperCase() },
    })
    if (existingSku) throw new ConflictError(MSG.skuExists)

    const payload: ICreateItemInput = {
      sku: newSku,
      name: `${raw.name} (Copia)`,
      brandId: raw.brandId as string,
      categoryId: raw.categoryId as string,
      unitId: raw.unitId as string,
      costPrice: Number(raw.costPrice),
      salePrice: Number(raw.salePrice),
      minStock: raw.minStock as number,
      reorderPoint: raw.reorderPoint as number,
      isActive: false,
      isSerialized: raw.isSerialized as boolean,
      hasBatch: raw.hasBatch as boolean,
      hasExpiry: raw.hasExpiry as boolean,
      allowNegativeStock: raw.allowNegativeStock as boolean,
      tags: (raw.tags as string[]) ?? [],
      ...(raw.modelId ? { modelId: raw.modelId as string } : {}),
      ...(raw.description ? { description: raw.description as string } : {}),
      ...(raw.location ? { location: raw.location as string } : {}),
      ...(raw.wholesalePrice != null
        ? { wholesalePrice: Number(raw.wholesalePrice) }
        : {}),
      ...(raw.maxStock != null ? { maxStock: raw.maxStock as number } : {}),
      ...(raw.technicalSpecs ? { technicalSpecs: raw.technicalSpecs } : {}),
    }

    return this.create(empresaId, payload, userId, db)
  }

  async checkAvailability(
    empresaId: string,
    items: { itemId: string; quantity: number; warehouseId: string }[],
    db: PrismaClientType
  ): Promise<{
    available: boolean
    details: Array<{
      itemId: string
      itemName: string
      requested: number
      available: number
      sufficient: boolean
    }>
  }> {
    const details: Array<{
      itemId: string
      itemName: string
      requested: number
      available: number
      sufficient: boolean
    }> = []

    let allAvailable = true

    for (const { itemId, quantity, warehouseId } of items) {
      const item = await this.findById(empresaId, itemId, true, db)
      const raw = item as unknown as Record<string, unknown>
      const stocks = (raw.stocks as Array<Record<string, unknown>>) ?? []
      const stock = stocks.find((s) => s.warehouseId === warehouseId)
      const available = Number(stock?.quantityAvailable ?? 0)
      const sufficient = available >= quantity
      if (!sufficient) allAvailable = false

      details.push({
        itemId,
        itemName: raw.name as string,
        requested: quantity,
        available,
        sufficient,
      })
    }

    return { available: allAvailable, details }
  }
}

export default new ItemService()
