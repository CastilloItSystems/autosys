// backend/src/features/inventory/items/items.service.ts
import prisma from '../../../services/prisma.service.js'
import type { PrismaClient } from '../../../generated/prisma/client.js'
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

type DB = PrismaClient

export class ItemService {
  private getDB(db?: DB): DB {
    return (db ?? prisma) as DB
  }

  private ensureEmpresaId(empresaId?: string): string {
    if (!empresaId) throw new BadRequestError('empresaId es requerido')
    return empresaId
  }

  async create(
    empresaId: string,
    data: ICreateItemInput,
    userId?: string,
    db?: DB
  ): Promise<IItemWithRelations> {
    const tenantEmpresaId = this.ensureEmpresaId(empresaId)
    const client = this.getDB(db)

    const existingSku = await client.item.findFirst({
      where: { empresaId: tenantEmpresaId, sku: data.sku.toUpperCase() },
    })
    if (existingSku) throw new ConflictError(INVENTORY_MESSAGES.item.skuExists)

    if (data.barcode) {
      const existingBarcode = await client.item.findFirst({
        where: { empresaId: tenantEmpresaId, barcode: data.barcode },
      })
      if (existingBarcode)
        throw new ConflictError(INVENTORY_MESSAGES.item.barcodeExists)
    }

    const [brand, category, unit] = await Promise.all([
      client.brand.findFirst({
        where: { id: data.brandId, empresaId: tenantEmpresaId },
      }),
      client.category.findFirst({
        where: { id: data.categoryId, empresaId: tenantEmpresaId },
      }),
      client.unit.findFirst({
        where: { id: data.unitId, empresaId: tenantEmpresaId },
      }),
    ])

    if (!brand) throw new NotFoundError('Marca no encontrada')
    if (!brand.isActive) throw new BadRequestError('La marca no está activa')
    if (!category) throw new NotFoundError('Categoría no encontrada')
    if (!category.isActive)
      throw new BadRequestError('La categoría no está activa')
    if (!unit) throw new NotFoundError('Unidad no encontrada')

    if (data.modelId) {
      const model = await client.model.findFirst({
        where: { id: data.modelId, empresaId: tenantEmpresaId },
      })
      if (!model) throw new NotFoundError('Modelo no encontrado')
      if (model.brandId !== data.brandId) {
        throw new BadRequestError(
          'El modelo no pertenece a la marca seleccionada'
        )
      }
    }

    if (data.location && !LocationValidator.isValid(data.location)) {
      throw new BadRequestError(INVENTORY_MESSAGES.item.invalidLocation)
    }

    if (data.salePrice < data.costPrice) {
      throw new BadRequestError(
        'El precio de venta debe ser mayor o igual al precio de costo'
      )
    }

    const item = await client.item.create({
      data: {
        empresaId: tenantEmpresaId,
        sku: data.sku.toUpperCase(),
        name: data.name,
        brandId: data.brandId,
        categoryId: data.categoryId,
        unitId: data.unitId,
        costPrice: data.costPrice as any,
        salePrice: data.salePrice as any,
        minStock: data.minStock ?? 5,
        maxStock: data.maxStock ?? 100,
        reorderPoint: data.reorderPoint ?? 10,
        isActive: data.isActive ?? true,
        isSerialized: data.isSerialized ?? false,
        hasBatch: data.hasBatch ?? false,
        hasExpiry: data.hasExpiry ?? false,
        allowNegativeStock: data.allowNegativeStock ?? false,
        tags: data.tags || [],
        historial: {
          action: 'CREATE',
          userId,
          timestamp: new Date().toISOString(),
          changes: data,
        } as any,

        ...(data.barcode ? { barcode: data.barcode } : {}),
        ...(data.description ? { description: data.description } : {}),
        ...(data.modelId ? { modelId: data.modelId } : {}),
        ...(data.location ? { location: data.location.toUpperCase() } : {}),
        ...(data.wholesalePrice != null
          ? { wholesalePrice: data.wholesalePrice as any }
          : {}),
        ...(data.technicalSpecs != null
          ? { technicalSpecs: data.technicalSpecs as any }
          : {}),
      },
      include: {
        brand: true,
        category: true,
        model: true,
        unit: true,
        images: true,
        _count: { select: { stocks: true, movements: true, images: true } },
      },
    })

    logger.info('Item created', {
      itemId: item.id,
      empresaId: tenantEmpresaId,
      userId,
    })
    return item as unknown as IItemWithRelations
  }

  async findById(
    empresaId: string,
    id: string,
    includeStock = true,
    db?: DB
  ): Promise<IItemWithRelations> {
    const tenantEmpresaId = this.ensureEmpresaId(empresaId)
    const client = this.getDB(db)

    const item = await client.item.findFirst({
      where: { id, empresaId: tenantEmpresaId },
      include: {
        brand: true,
        category: true,
        model: true,
        unit: true,
        images: { orderBy: { order: 'asc' } },
        stocks: includeStock ? { include: { warehouse: true } } : false,
        _count: {
          select: {
            stocks: true,
            movements: true,
            images: true,
            reservations: true,
          },
        },
      },
    })

    if (!item) throw new NotFoundError(INVENTORY_MESSAGES.item.notFound)
    return item as unknown as IItemWithRelations
  }

  async findBySku(
    empresaId: string,
    sku: string,
    db?: DB
  ): Promise<IItemWithRelations | null> {
    const tenantEmpresaId = this.ensureEmpresaId(empresaId)
    const client = this.getDB(db)

    const item = await client.item.findFirst({
      where: { empresaId: tenantEmpresaId, sku: sku.toUpperCase() },
      include: {
        brand: true,
        category: true,
        model: true,
        unit: true,
        images: true,
        stocks: true,
        _count: { select: { stocks: true, movements: true, images: true } },
      },
    })
    return item as unknown as IItemWithRelations | null
  }

  async findByBarcode(
    empresaId: string,
    barcode: string,
    db?: DB
  ): Promise<IItemWithRelations | null> {
    const tenantEmpresaId = this.ensureEmpresaId(empresaId)
    const client = this.getDB(db)

    const item = await client.item.findFirst({
      where: { empresaId: tenantEmpresaId, barcode },
      include: {
        brand: true,
        category: true,
        model: true,
        unit: true,
        images: true,
        stocks: true,
        _count: { select: { stocks: true, movements: true, images: true } },
      },
    })
    return item as unknown as IItemWithRelations | null
  }

  async update(
    empresaId: string,
    id: string,
    data: IUpdateItemInput,
    userId?: string,
    db?: DB
  ): Promise<IItemWithRelations> {
    const tenantEmpresaId = this.ensureEmpresaId(empresaId)
    const client = this.getDB(db)

    const existing = await this.findById(tenantEmpresaId, id, false, client)

    if (data.sku && data.sku !== existing.sku) {
      const existingSku = await client.item.findFirst({
        where: {
          empresaId: tenantEmpresaId,
          sku: data.sku.toUpperCase(),
          id: { not: id },
        },
      })
      if (existingSku)
        throw new ConflictError(INVENTORY_MESSAGES.item.skuExists)
    }

    if (data.barcode && data.barcode !== (existing as any).barcode) {
      const existingBarcode = await client.item.findFirst({
        where: {
          empresaId: tenantEmpresaId,
          barcode: data.barcode,
          id: { not: id },
        },
      })
      if (existingBarcode)
        throw new ConflictError(INVENTORY_MESSAGES.item.barcodeExists)
    }

    const result = await client.item.updateMany({
      where: { id, empresaId: tenantEmpresaId },
      data: {
        ...(data.sku && { sku: data.sku.toUpperCase() }),
        ...(data.barcode !== undefined && { barcode: data.barcode }),
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.brandId && { brandId: data.brandId }),
        ...(data.categoryId && { categoryId: data.categoryId }),
        ...(data.modelId !== undefined && { modelId: data.modelId }),
        ...(data.unitId && { unitId: data.unitId }),
        ...(data.location !== undefined && {
          location: data.location?.toUpperCase(),
        }),
        ...(data.costPrice !== undefined && {
          costPrice: data.costPrice as any,
        }),
        ...(data.salePrice !== undefined && {
          salePrice: data.salePrice as any,
        }),
        ...(data.wholesalePrice !== undefined && {
          wholesalePrice: data.wholesalePrice as any,
        }),
        ...(data.minStock !== undefined && { minStock: data.minStock }),
        ...(data.maxStock !== undefined && { maxStock: data.maxStock }),
        ...(data.reorderPoint !== undefined && {
          reorderPoint: data.reorderPoint,
        }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.isSerialized !== undefined && {
          isSerialized: data.isSerialized,
        }),
        ...(data.hasBatch !== undefined && { hasBatch: data.hasBatch }),
        ...(data.hasExpiry !== undefined && { hasExpiry: data.hasExpiry }),
        ...(data.allowNegativeStock !== undefined && {
          allowNegativeStock: data.allowNegativeStock,
        }),
        ...(data.technicalSpecs !== undefined && {
          technicalSpecs: (data.technicalSpecs as any) || null,
        }),
        ...(data.tags && { tags: data.tags }),
        historial: {
          action: 'UPDATE',
          userId,
          timestamp: new Date().toISOString(),
          changes: data,
        } as any,
      },
    })

    if (result.count === 0)
      throw new NotFoundError(INVENTORY_MESSAGES.item.notFound)
    return this.findById(tenantEmpresaId, id, true, client)
  }

  async findAll(
    empresaId: string,
    filters: IItemFilters = {},
    page = 1,
    limit = 10,
    sortBy = 'name',
    sortOrder: 'asc' | 'desc' = 'asc',
    db?: DB
  ) {
    const tenantEmpresaId = this.ensureEmpresaId(empresaId)
    const client = this.getDB(db)
    const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

    const where: any = { empresaId: tenantEmpresaId }

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
      if (filters.minPrice !== undefined) where.salePrice.gte = filters.minPrice
      if (filters.maxPrice !== undefined) where.salePrice.lte = filters.maxPrice
    }

    const [items, total] = await Promise.all([
      client.item.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          brand: true,
          category: true,
          model: true,
          unit: true,
          images: { orderBy: { order: 'asc' } },
          stocks: {
            select: {
              quantityReal: true,
              quantityReserved: true,
              quantityAvailable: true,
            },
          },
          _count: { select: { stocks: true, movements: true, images: true } },
        },
      }),
      client.item.count({ where }),
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

  async delete(
    empresaId: string,
    id: string,
    userId?: string,
    db?: DB
  ): Promise<void> {
    const tenantEmpresaId = this.ensureEmpresaId(empresaId)
    const client = this.getDB(db)

    const result = await client.item.updateMany({
      where: { id, empresaId: tenantEmpresaId },
      data: {
        isActive: false,
        historial: {
          action: 'DELETE',
          userId,
          timestamp: new Date().toISOString(),
        } as any,
      },
    })

    if (result.count === 0)
      throw new NotFoundError(INVENTORY_MESSAGES.item.notFound)
  }

  async hardDelete(
    empresaId: string,
    id: string,
    userId?: string,
    db?: DB
  ): Promise<void> {
    const tenantEmpresaId = this.ensureEmpresaId(empresaId)
    const client = this.getDB(db)

    const item = await client.item.findFirst({
      where: { id, empresaId: tenantEmpresaId },
      include: { _count: { select: { movements: true, stocks: true } } },
    })
    if (!item) throw new NotFoundError(INVENTORY_MESSAGES.item.notFound)

    if (item._count.movements > 0) {
      throw new BadRequestError(INVENTORY_MESSAGES.item.hasMovements)
    }

    const activeStock = await client.stock.count({
      where: { itemId: id, quantityReal: { gt: 0 } },
    })
    if (activeStock > 0)
      throw new BadRequestError(INVENTORY_MESSAGES.item.hasStock)

    await client.itemImage.deleteMany({ where: { itemId: id } })

    const deleted = await client.item.deleteMany({
      where: { id, empresaId: tenantEmpresaId },
    })
    if (deleted.count === 0)
      throw new NotFoundError(INVENTORY_MESSAGES.item.notFound)

    logger.warn('Item hard deleted', {
      itemId: id,
      empresaId: tenantEmpresaId,
      userId,
    })
  }

  async toggleActive(
    empresaId: string,
    id: string,
    userId?: string,
    db?: DB
  ): Promise<IItemWithRelations> {
    const item = await this.findById(empresaId, id, false, db)
    return this.update(empresaId, id, { isActive: !item.isActive }, userId, db)
  }

  async findActive(
    empresaId: string,
    limit = 100,
    db?: DB
  ): Promise<IItemWithRelations[]> {
    const tenantEmpresaId = this.ensureEmpresaId(empresaId)
    const client = this.getDB(db)

    const items = await client.item.findMany({
      where: { empresaId: tenantEmpresaId, isActive: true },
      take: limit,
      orderBy: { name: 'asc' },
      include: {
        brand: true,
        category: true,
        model: true,
        unit: true,
        images: true,
        stocks: true,
        _count: { select: { stocks: true, movements: true, images: true } },
      },
    })

    return items as unknown as IItemWithRelations[]
  }

  async search(
    empresaId: string,
    term: string,
    limit = 20,
    db?: DB
  ): Promise<IItemWithRelations[]> {
    const tenantEmpresaId = this.ensureEmpresaId(empresaId)
    const client = this.getDB(db)

    const items = await client.item.findMany({
      where: {
        empresaId: tenantEmpresaId,
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
      include: {
        brand: true,
        category: true,
        model: true,
        unit: true,
        images: { where: { isPrimary: true }, take: 1 },
        stocks: { select: { quantityAvailable: true } },
      },
    })

    return items as unknown as IItemWithRelations[]
  }

  async findLowStock(empresaId: string, warehouseId?: string, db?: DB) {
    const tenantEmpresaId = this.ensureEmpresaId(empresaId)
    const client = this.getDB(db)

    const items = await client.item.findMany({
      where: { empresaId: tenantEmpresaId, isActive: true },
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

    return items.filter((item: any) => {
      const totalAvailable = item.stocks.reduce(
        (sum: number, s: any) => sum + s.quantityAvailable,
        0
      )
      return totalAvailable <= item.minStock
    })
  }

  async findOutOfStock(empresaId: string, warehouseId?: string, db?: DB) {
    const tenantEmpresaId = this.ensureEmpresaId(empresaId)
    const client = this.getDB(db)

    const items = await client.item.findMany({
      where: { empresaId: tenantEmpresaId, isActive: true },
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

    return items.filter((item: any) => {
      const totalAvailable = item.stocks.reduce(
        (sum: number, s: any) => sum + s.quantityAvailable,
        0
      )
      return totalAvailable === 0
    })
  }

  async findByCategory(
    empresaId: string,
    categoryId: string,
    includeSubcategories = true,
    db?: DB
  ): Promise<IItemWithRelations[]> {
    const tenantEmpresaId = this.ensureEmpresaId(empresaId)
    const client = this.getDB(db)

    const category = await client.category.findFirst({
      where: { id: categoryId, empresaId: tenantEmpresaId },
    })
    if (!category) throw new NotFoundError('Categoría no encontrada')

    const categoryIds = [categoryId]
    if (includeSubcategories) {
      const children = await client.category.findMany({
        where: { empresaId: tenantEmpresaId, parentId: categoryId },
        select: { id: true },
      })
      categoryIds.push(...children.map((c) => c.id))
    }

    const items = await client.item.findMany({
      where: {
        empresaId: tenantEmpresaId,
        categoryId: { in: categoryIds },
        isActive: true,
      },
      orderBy: { name: 'asc' },
      include: {
        brand: true,
        category: true,
        model: true,
        unit: true,
        images: true,
        stocks: true,
        _count: { select: { stocks: true, movements: true, images: true } },
      },
    })

    return items as unknown as IItemWithRelations[]
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
    userId?: string,
    db?: DB
  ): Promise<IItemWithRelations> {
    const tenantEmpresaId = this.ensureEmpresaId(empresaId)
    const client = this.getDB(db)

    const item = await this.findById(tenantEmpresaId, id, false, client)

    let costPrice = data.costPrice ?? Number((item as any).costPrice)
    let salePrice = data.salePrice ?? Number((item as any).salePrice)
    const wholesalePrice =
      data.wholesalePrice ?? Number((item as any).wholesalePrice ?? 0)

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

    await client.item.updateMany({
      where: { id, empresaId: tenantEmpresaId },
      data: {
        costPrice: costPrice as any,
        salePrice: salePrice as any,
        wholesalePrice: wholesalePrice as any,
        historial: {
          action: 'UPDATE_PRICING',
          userId,
          timestamp: new Date().toISOString(),
          previousPrices: {
            costPrice: Number((item as any).costPrice),
            salePrice: Number((item as any).salePrice),
            wholesalePrice: Number((item as any).wholesalePrice ?? 0),
          },
          newPrices: { costPrice, salePrice, wholesalePrice },
        } as any,
      },
    })

    return this.findById(tenantEmpresaId, id, true, client)
  }

  async bulkUpdate(
    empresaId: string,
    itemIds: string[],
    updates: {
      categoryId?: string
      isActive?: boolean
      tags?: string[]
      applyPriceIncrease?: number
    },
    userId?: string,
    db?: DB
  ) {
    const tenantEmpresaId = this.ensureEmpresaId(empresaId)
    const client = this.getDB(db)

    const results = { success: [] as any[], errors: [] as any[] }

    for (const itemId of itemIds) {
      try {
        const item = await this.findById(tenantEmpresaId, itemId, false, client)

        const updateData: any = {}
        if (updates.categoryId) updateData.categoryId = updates.categoryId
        if (updates.isActive !== undefined)
          updateData.isActive = updates.isActive
        if (updates.tags)
          updateData.tags = updates.tags.map((t) => t.toLowerCase())

        if (updates.applyPriceIncrease !== undefined) {
          const inc = updates.applyPriceIncrease / 100
          updateData.costPrice = Number((item as any).costPrice) * (1 + inc)
          updateData.salePrice = Number((item as any).salePrice) * (1 + inc)
          if ((item as any).wholesalePrice) {
            updateData.wholesalePrice =
              Number((item as any).wholesalePrice) * (1 + inc)
          }
        }

        await client.item.updateMany({
          where: { id: itemId, empresaId: tenantEmpresaId },
          data: {
            ...updateData,
            historial: {
              action: 'BULK_UPDATE',
              userId,
              timestamp: new Date().toISOString(),
              updates,
            } as any,
          },
        })

        results.success.push({ itemId, ok: true })
      } catch (error: any) {
        results.errors.push({ itemId, error: error.message })
      }
    }

    return results
  }

  async bulkCreate(
    empresaId: string,
    items: ICreateItemInput[],
    userId?: string,
    db?: DB
  ) {
    const results = { success: [] as any[], errors: [] as any[] }
    for (const itemData of items) {
      try {
        const item = await this.create(empresaId, itemData, userId, db)
        results.success.push(item)
      } catch (error: any) {
        results.errors.push({
          sku: itemData.sku,
          name: itemData.name,
          error: error.message,
        })
      }
    }
    return results
  }

  async generateSKU(categoryCode: string, brandCode: string): Promise<string> {
    return `${categoryCode}-${brandCode}-${Date.now().toString().slice(-6)}`
  }

  async getHistory(empresaId: string, id: string, db?: DB): Promise<any[]> {
    const tenantEmpresaId = this.ensureEmpresaId(empresaId)
    const client = this.getDB(db)

    const item = await client.item.findFirst({
      where: { id, empresaId: tenantEmpresaId },
      select: { historial: true },
    })
    if (!item) throw new NotFoundError(INVENTORY_MESSAGES.item.notFound)

    const historial = item.historial as any
    return Array.isArray(historial) ? historial : []
  }

  async getStats(empresaId: string, id: string, db?: DB) {
    const tenantEmpresaId = this.ensureEmpresaId(empresaId)
    const client = this.getDB(db)

    const item = await this.findById(tenantEmpresaId, id, true, client)
    const stocks = (item as any).stocks || []

    const totalStock = stocks.reduce(
      (sum: number, s: any) => sum + s.quantityReal,
      0
    )
    const availableStock = stocks.reduce(
      (sum: number, s: any) => sum + s.quantityAvailable,
      0
    )
    const reservedStock = stocks.reduce(
      (sum: number, s: any) => sum + s.quantityReserved,
      0
    )

    const [recentMovements, totalMovements, lastSale, totalSales] =
      await Promise.all([
        client.movement.findMany({
          where: { itemId: id },
          take: 10,
          orderBy: { movementDate: 'desc' },
        }),
        client.movement.count({ where: { itemId: id } }),
        client.movement.findFirst({
          where: { itemId: id, type: 'SALE' },
          orderBy: { movementDate: 'desc' },
        }),
        client.movement.count({ where: { itemId: id, type: 'SALE' } }),
      ])

    const margin = PriceCalculator.calculateMargin(
      Number((item as any).costPrice),
      Number((item as any).salePrice)
    )

    return {
      item: {
        id: (item as any).id,
        sku: (item as any).sku,
        name: (item as any).name,
      },
      stock: {
        total: totalStock,
        available: availableStock,
        reserved: reservedStock,
      },
      pricing: {
        costPrice: Number((item as any).costPrice),
        salePrice: Number((item as any).salePrice),
        wholesalePrice: (item as any).wholesalePrice
          ? Number((item as any).wholesalePrice)
          : null,
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
    limit = 10,
    db?: DB
  ): Promise<IItemWithRelations[]> {
    const tenantEmpresaId = this.ensureEmpresaId(empresaId)
    const client = this.getDB(db)

    const item = await this.findById(tenantEmpresaId, id, false, client)

    const related = await client.item.findMany({
      where: {
        empresaId: tenantEmpresaId,
        id: { not: id },
        isActive: true,
        OR: [
          { categoryId: (item as any).categoryId },
          { brandId: (item as any).brandId },
          { modelId: (item as any).modelId || null },
        ],
      },
      take: limit,
      orderBy: { name: 'asc' },
      include: {
        brand: true,
        category: true,
        model: true,
        unit: true,
        images: { where: { isPrimary: true }, take: 1 },
        stocks: { select: { quantityAvailable: true } },
      },
    })

    return related as unknown as IItemWithRelations[]
  }

  async duplicate(
    empresaId: string,
    id: string,
    newSku: string,
    userId?: string,
    db?: DB
  ): Promise<IItemWithRelations> {
    const tenantEmpresaId = this.ensureEmpresaId(empresaId)
    const client = this.getDB(db)

    const original = await this.findById(tenantEmpresaId, id, false, client)

    const existingSku = await client.item.findFirst({
      where: { empresaId: tenantEmpresaId, sku: newSku.toUpperCase() },
    })
    if (existingSku) throw new ConflictError('El nuevo SKU ya existe')

    const payload: ICreateItemInput = {
      sku: newSku,
      name: `${(original as any).name} (Copia)`,
      brandId: (original as any).brandId,
      categoryId: (original as any).categoryId,
      unitId: (original as any).unitId,
      costPrice: Number((original as any).costPrice),
      salePrice: Number((original as any).salePrice),
      minStock: (original as any).minStock,
      reorderPoint: (original as any).reorderPoint,
      isActive: false,
      isSerialized: (original as any).isSerialized,
      hasBatch: (original as any).hasBatch,
      hasExpiry: (original as any).hasExpiry,
      allowNegativeStock: (original as any).allowNegativeStock,
      tags: (original as any).tags ?? [],

      ...((original as any).modelId
        ? { modelId: (original as any).modelId }
        : {}),
      ...((original as any).description
        ? { description: (original as any).description }
        : {}),
      ...((original as any).location
        ? { location: (original as any).location }
        : {}),
      ...((original as any).wholesalePrice != null
        ? { wholesalePrice: Number((original as any).wholesalePrice) }
        : {}),
      ...((original as any).maxStock != null
        ? { maxStock: (original as any).maxStock }
        : {}),
      ...((original as any).technicalSpecs
        ? { technicalSpecs: (original as any).technicalSpecs }
        : {}),
    }

    const duplicated = await this.create(
      tenantEmpresaId,
      payload,
      userId,
      client
    )
    return duplicated
  }
  async checkAvailability(
    empresaId: string,
    items: { itemId: string; quantity: number; warehouseId: string }[],
    db?: DB
  ) {
    const tenantEmpresaId = this.ensureEmpresaId(empresaId)
    const client = this.getDB(db)

    const details: {
      itemId: string
      itemName: string
      requested: number
      available: number
      sufficient: boolean
    }[] = []

    let allAvailable = true

    for (const { itemId, quantity, warehouseId } of items) {
      const item = await this.findById(tenantEmpresaId, itemId, true, client)
      const stock = (item as any).stocks?.find(
        (s: any) => s.warehouseId === warehouseId
      )
      const available = stock?.quantityAvailable || 0
      const sufficient = available >= quantity
      if (!sufficient) allAvailable = false

      details.push({
        itemId,
        itemName: (item as any).name,
        requested: quantity,
        available,
        sufficient,
      })
    }

    return { available: allAvailable, details }
  }
}

export default new ItemService()
