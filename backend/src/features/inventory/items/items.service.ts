// backend/src/features/inventory/items/items.service.ts

import prisma from '../../../services/prisma.service'
import {
  ICreateItemInput,
  IUpdateItemInput,
  IItemFilters,
  IItemWithRelations,
  IItemWithStock,
} from './items.interface'
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from '../../../shared/utils/ApiError'
import { PaginationHelper } from '../../../shared/utils/pagination'
import { INVENTORY_MESSAGES } from '../shared/constants/messages'
import { logger } from '../../../shared/utils/logger'
import { SKUGenerator } from '../shared/utils/skuGenerator'
import { LocationValidator } from '../shared/utils/locationValidator'
import { PriceCalculator } from '../shared/utils/priceCalculator'

export class ItemService {
  /**
   * Crear un nuevo artículo
   */
  async create(
    data: ICreateItemInput,
    userId?: string
  ): Promise<IItemWithRelations> {
    try {
      // Verificar si el SKU ya existe
      const existingSku = await prisma.item.findUnique({
        where: { sku: data.sku.toUpperCase() },
      })

      if (existingSku) {
        throw new ConflictError(INVENTORY_MESSAGES.item.skuExists)
      }

      // Verificar si el barcode ya existe (si se proporciona)
      if (data.barcode) {
        const existingBarcode = await prisma.item.findUnique({
          where: { barcode: data.barcode },
        })

        if (existingBarcode) {
          throw new ConflictError(INVENTORY_MESSAGES.item.barcodeExists)
        }
      }

      // Verificar que la marca existe y está activa
      const brand = await prisma.brand.findUnique({
        where: { id: data.brandId },
      })

      if (!brand) {
        throw new NotFoundError('Marca no encontrada')
      }

      if (!brand.isActive) {
        throw new BadRequestError('La marca no está activa')
      }

      // Verificar que la categoría existe y está activa
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      })

      if (!category) {
        throw new NotFoundError('Categoría no encontrada')
      }

      if (!category.isActive) {
        throw new BadRequestError('La categoría no está activa')
      }

      // Verificar que la unidad existe
      const unit = await prisma.unit.findUnique({
        where: { id: data.unitId },
      })

      if (!unit) {
        throw new NotFoundError('Unidad no encontrada')
      }

      // Verificar el modelo si se proporciona
      if (data.modelId) {
        const model = await prisma.model.findUnique({
          where: { id: data.modelId },
        })

        if (!model) {
          throw new NotFoundError('Modelo no encontrado')
        }

        // Verificar que el modelo pertenece a la marca
        if (model.brandId !== data.brandId) {
          throw new BadRequestError(
            'El modelo no pertenece a la marca seleccionada'
          )
        }
      }

      // Validar ubicación si se proporciona
      if (data.location) {
        const isValidLocation = LocationValidator.isValid(data.location)
        if (!isValidLocation) {
          throw new BadRequestError(INVENTORY_MESSAGES.item.invalidLocation)
        }
      }

      // Validar precios
      if (data.salePrice < data.costPrice) {
        throw new BadRequestError(
          'El precio de venta debe ser mayor o igual al precio de costo'
        )
      }

      // Crear el artículo
      const createData: any = {
        sku: data.sku.toUpperCase(),
        name: data.name,
        brandId: data.brandId,
        categoryId: data.categoryId,
        unitId: data.unitId,
        costPrice: data.costPrice,
        salePrice: data.salePrice,
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
          changes: data as any,
        },
      }
      if (data.barcode) createData.barcode = data.barcode
      if (data.description) createData.description = data.description
      if (data.modelId) createData.modelId = data.modelId
      if (data.location) createData.location = data.location.toUpperCase()
      if (data.wholesalePrice) createData.wholesalePrice = data.wholesalePrice
      if (data.technicalSpecs) createData.technicalSpecs = data.technicalSpecs

      const item = await prisma.item.create({
        data: createData,
        include: {
          brand: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          category: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          model: {
            select: {
              id: true,
              name: true,
              year: true,
            },
          },
          unit: {
            select: {
              id: true,
              code: true,
              name: true,
              abbreviation: true,
            },
          },
          images: true,
          _count: {
            select: {
              stocks: true,
              movements: true,
              images: true,
            },
          },
        },
      })

      logger.info('Item created', {
        itemId: item.id,
        sku: item.sku,
        name: item.name,
        userId,
      })

      return item as any
    } catch (error) {
      logger.error('Error creating item', { error, data, userId })
      throw error
    }
  }

  /**
   * Obtener todos los artículos con paginación y filtros
   */
  async findAll(
    filters: IItemFilters,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'name',
    sortOrder: 'asc' | 'desc' = 'asc',
    prismaClient?: any // Parámetro opcional para Prisma client extendido con contexto de empresa
  ) {
    try {
      // Usar el Prisma client extendido si se proporciona, sino usar el global
      const db = prismaClient || prisma

      const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

      // Construir filtros
      const where: any = {}

      // Búsqueda general
      if (filters.search) {
        where.OR = [
          { sku: { contains: filters.search, mode: 'insensitive' } },
          { name: { contains: filters.search, mode: 'insensitive' } },
          { barcode: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
          { tags: { has: filters.search.toLowerCase() } },
        ]
      }

      // Filtros específicos
      if (filters.brandId) {
        where.brandId = filters.brandId
      }

      if (filters.categoryId) {
        where.categoryId = filters.categoryId
      }

      if (filters.modelId) {
        where.modelId = filters.modelId
      }

      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive
      }

      // Filtrar por tags
      if (filters.tags && filters.tags.length > 0) {
        where.tags = {
          hasSome: filters.tags.map((tag) => tag.toLowerCase()),
        }
      }

      // Filtrar por rango de precios
      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        where.salePrice = {}
        if (filters.minPrice !== undefined) {
          where.salePrice.gte = filters.minPrice
        }
        if (filters.maxPrice !== undefined) {
          where.salePrice.lte = filters.maxPrice
        }
      }

      // Filtrar por stock
      if (filters.inStock) {
        where.stocks = {
          some: {
            quantityAvailable: {
              gt: 0,
            },
          },
        }
      }

      if (filters.lowStock) {
        // Items con stock disponible menor al mínimo
        where.stocks = {
          some: {
            quantityAvailable: {
              lte: prisma.item.fields.minStock,
            },
          },
        }
      }

      // Ordenamiento
      const orderBy: any = {}
      orderBy[sortBy] = sortOrder

      // Ejecutar consultas en paralelo
      const [items, total] = await Promise.all([
        db.item.findMany({
          where,
          skip,
          take,
          orderBy,
          include: {
            brand: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
            category: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
            model: {
              select: {
                id: true,
                name: true,
                year: true,
                brand: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            unit: {
              select: {
                id: true,
                code: true,
                name: true,
                abbreviation: true,
              },
            },
            images: {
              orderBy: { order: 'asc' },
            },
            stocks: {
              select: {
                quantityReal: true,
                quantityReserved: true,
                quantityAvailable: true,
              },
            },
            _count: {
              select: {
                stocks: true,
                movements: true,
                images: true,
              },
            },
          },
        }),
        db.item.count({ where }),
      ])

      const meta = PaginationHelper.getMeta(page, limit, total)

      return {
        items,
        ...meta,
      }
    } catch (error) {
      logger.error('Error finding items', { error, filters })
      throw error
    }
  }

  /**
   * Obtener artículo por ID
   */
  async findById(
    id: string,
    includeStock: boolean = true
  ): Promise<IItemWithRelations> {
    try {
      const item = await prisma.item.findUnique({
        where: { id },
        include: {
          brand: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          category: {
            select: {
              id: true,
              code: true,
              name: true,
              defaultMargin: true,
            },
          },
          model: {
            select: {
              id: true,
              name: true,
              year: true,
              brand: {
                select: {
                  name: true,
                },
              },
            },
          },
          unit: {
            select: {
              id: true,
              code: true,
              name: true,
              abbreviation: true,
            },
          },
          images: {
            orderBy: { order: 'asc' },
          },
          stocks: includeStock
            ? {
                include: {
                  warehouse: {
                    select: {
                      id: true,
                      code: true,
                      name: true,
                    },
                  },
                },
              }
            : false,
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

      if (!item) {
        throw new NotFoundError(INVENTORY_MESSAGES.item.notFound)
      }

      return item as any
    } catch (error) {
      logger.error('Error finding item by ID', { error, id })
      throw error
    }
  }

  /**
   * Obtener artículo por SKU
   */
  async findBySku(sku: string): Promise<IItemWithRelations | null> {
    try {
      const item = await prisma.item.findUnique({
        where: { sku: sku.toUpperCase() },
        include: {
          brand: true,
          category: true,
          model: true,
          unit: true,
          images: true,
          stocks: true,
          _count: {
            select: {
              stocks: true,
              movements: true,
              images: true,
            },
          },
        },
      })

      return item as any
    } catch (error) {
      logger.error('Error finding item by SKU', { error, sku })
      throw error
    }
  }

  /**
   * Obtener artículo por código de barras
   */
  async findByBarcode(barcode: string): Promise<IItemWithRelations | null> {
    try {
      const item = await prisma.item.findUnique({
        where: { barcode },
        include: {
          brand: true,
          category: true,
          model: true,
          unit: true,
          images: true,
          stocks: true,
          _count: {
            select: {
              stocks: true,
              movements: true,
              images: true,
            },
          },
        },
      })

      return item as any
    } catch (error) {
      logger.error('Error finding item by barcode', { error, barcode })
      throw error
    }
  }

  /**
   * Actualizar artículo
   */
  async update(
    id: string,
    data: IUpdateItemInput,
    userId?: string
  ): Promise<IItemWithRelations> {
    try {
      // Verificar que existe
      const existing = await this.findById(id, false)

      // Guardar estado anterior para historial
      const previousState = {
        sku: existing.sku,
        name: existing.name,
        costPrice: existing.costPrice,
        salePrice: existing.salePrice,
        // ... otros campos relevantes
      }

      // Si se actualiza el SKU, verificar que no exista
      if (data.sku && data.sku !== existing.sku) {
        const existingSku = await prisma.item.findUnique({
          where: { sku: data.sku.toUpperCase() },
        })

        if (existingSku) {
          throw new ConflictError(INVENTORY_MESSAGES.item.skuExists)
        }
      }

      // Si se actualiza el barcode, verificar que no exista
      if (data.barcode && data.barcode !== existing.barcode) {
        const existingBarcode = await prisma.item.findUnique({
          where: { barcode: data.barcode },
        })

        if (existingBarcode) {
          throw new ConflictError(INVENTORY_MESSAGES.item.barcodeExists)
        }
      }

      // Validar marca si se actualiza
      if (data.brandId && data.brandId !== existing.brandId) {
        const brand = await prisma.brand.findUnique({
          where: { id: data.brandId },
        })

        if (!brand || !brand.isActive) {
          throw new BadRequestError('Marca no válida')
        }
      }

      // Validar categoría si se actualiza
      if (data.categoryId && data.categoryId !== existing.categoryId) {
        const category = await prisma.category.findUnique({
          where: { id: data.categoryId },
        })

        if (!category || !category.isActive) {
          throw new BadRequestError('Categoría no válida')
        }
      }

      // Validar modelo si se actualiza
      if (data.modelId) {
        const model = await prisma.model.findUnique({
          where: { id: data.modelId },
        })

        if (!model) {
          throw new NotFoundError('Modelo no encontrado')
        }

        const targetBrandId = data.brandId || existing.brandId
        if (model.brandId !== targetBrandId) {
          throw new BadRequestError(
            'El modelo no pertenece a la marca seleccionada'
          )
        }
      }

      // Validar ubicación si se actualiza
      if (data.location) {
        const isValidLocation = LocationValidator.isValid(data.location)
        if (!isValidLocation) {
          throw new BadRequestError(INVENTORY_MESSAGES.item.invalidLocation)
        }
      }

      // Preparar historial
      const currentHistorial = existing.historial as any
      const historialArray = Array.isArray(currentHistorial)
        ? currentHistorial
        : []

      const newHistorial = [
        ...historialArray,
        {
          action: 'UPDATE',
          userId,
          timestamp: new Date().toISOString(),
          previousState,
          changes: data,
        },
      ]

      // Actualizar
      const item = await prisma.item.update({
        where: { id },
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
          ...(data.costPrice !== undefined && { costPrice: data.costPrice }),
          ...(data.salePrice !== undefined && { salePrice: data.salePrice }),
          ...(data.wholesalePrice !== undefined && {
            wholesalePrice: data.wholesalePrice,
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
            technicalSpecs: data.technicalSpecs || null,
          }),
          ...(data.tags && { tags: data.tags }),
          historial: newHistorial,
        },
        include: {
          brand: true,
          category: true,
          model: true,
          unit: true,
          images: true,
          stocks: true,
          _count: {
            select: {
              stocks: true,
              movements: true,
              images: true,
            },
          },
        },
      })

      logger.info('Item updated', { itemId: id, userId })

      return item as any
    } catch (error) {
      logger.error('Error updating item', { error, id, data, userId })
      throw error
    }
  }

  /**
   * Eliminar artículo (soft delete)
   */
  async delete(id: string, userId?: string): Promise<void> {
    try {
      const item = await this.findById(id, true)

      // Verificar que no tenga stock
      if (item._count && item._count.stocks > 0) {
        const hasStock = await prisma.stock.findFirst({
          where: {
            itemId: id,
            quantityReal: {
              gt: 0,
            },
          },
        })

        if (hasStock) {
          throw new BadRequestError(INVENTORY_MESSAGES.item.hasStock)
        }
      }

      // Verificar que no tenga reservas activas
      const hasActiveReservations = await prisma.reservation.count({
        where: {
          itemId: id,
          status: {
            in: ['ACTIVE', 'PENDING_PICKUP'],
          },
        },
      })

      if (hasActiveReservations > 0) {
        throw new BadRequestError(
          'No se puede eliminar un artículo con reservas activas'
        )
      }

      // Soft delete
      await prisma.item.update({
        where: { id },
        data: {
          isActive: false,
          historial: {
            action: 'DELETE',
            userId,
            timestamp: new Date().toISOString(),
          },
        },
      })

      logger.info('Item soft deleted', { itemId: id, userId })
    } catch (error) {
      logger.error('Error deleting item', { error, id, userId })
      throw error
    }
  }

  /**
   * Eliminar artículo permanentemente
   */
  async hardDelete(id: string, userId?: string): Promise<void> {
    try {
      const item = await this.findById(id, true)

      // Verificar que no tenga movimientos
      if (item._count && item._count.movements > 0) {
        throw new BadRequestError(INVENTORY_MESSAGES.item.hasMovements)
      }

      // Verificar que no tenga stock
      if (item._count && item._count.stocks > 0) {
        throw new BadRequestError(INVENTORY_MESSAGES.item.hasStock)
      }

      // Eliminar permanentemente
      await prisma.item.delete({
        where: { id },
      })

      logger.info('Item hard deleted', { itemId: id, userId })
    } catch (error) {
      logger.error('Error hard deleting item', { error, id, userId })
      throw error
    }
  }

  /**
   * Activar/Desactivar artículo
   */
  async toggleActive(id: string, userId?: string): Promise<IItemWithRelations> {
    try {
      const item = await this.findById(id, false)

      const updated = await prisma.item.update({
        where: { id },
        data: {
          isActive: !item.isActive,
          historial: {
            action: 'TOGGLE_ACTIVE',
            userId,
            timestamp: new Date().toISOString(),
            newStatus: !item.isActive,
          },
        },
        include: {
          brand: true,
          category: true,
          model: true,
          unit: true,
          images: true,
          stocks: true,
          _count: {
            select: {
              stocks: true,
              movements: true,
              images: true,
            },
          },
        },
      })

      logger.info('Item active status toggled', {
        itemId: id,
        newStatus: updated.isActive,
        userId,
      })

      return updated as any
    } catch (error) {
      logger.error('Error toggling item active status', { error, id, userId })
      throw error
    }
  }

  /**
   * Obtener artículos activos
   */
  async findActive(limit: number = 100): Promise<IItemWithRelations[]> {
    try {
      const items = await prisma.item.findMany({
        where: { isActive: true },
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          brand: true,
          category: true,
          model: true,
          unit: true,
          images: true,
          stocks: {
            select: {
              quantityReal: true,
              quantityAvailable: true,
              quantityReserved: true,
            },
          },
          _count: {
            select: {
              stocks: true,
              movements: true,
              images: true,
            },
          },
        },
      })

      return items as any
    } catch (error) {
      logger.error('Error finding active items', { error })
      throw error
    }
  }

  /**
   * Buscar artículos
   */
  async search(
    term: string,
    limit: number = 20
  ): Promise<IItemWithRelations[]> {
    try {
      const items = await prisma.item.findMany({
        where: {
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
          images: {
            where: { isPrimary: true },
            take: 1,
          },
          stocks: {
            select: {
              quantityAvailable: true,
            },
          },
        },
      })

      return items as any
    } catch (error) {
      logger.error('Error searching items', { error, term })
      throw error
    }
  }
  /**
   * Obtener artículos con stock bajo
   */
  async findLowStock(warehouseId?: string): Promise<IItemWithStock[]> {
    try {
      const where: any = {
        isActive: true,
      }

      const items = await prisma.item.findMany({
        where,
        include: {
          brand: true,
          category: true,
          unit: true,
          images: {
            where: { isPrimary: true },
            take: 1,
          },
          stocks: warehouseId
            ? {
                where: { warehouseId },
                include: {
                  warehouse: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              }
            : {
                include: {
                  warehouse: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
        },
      })

      // Filtrar artículos con stock bajo
      const lowStockItems = items.filter((item: any) => {
        const totalAvailable = item.stocks.reduce(
          (sum: number, s: any) => sum + s.quantityAvailable,
          0
        )
        return totalAvailable <= item.minStock
      })

      return lowStockItems as any
    } catch (error) {
      logger.error('Error finding low stock items', { error, warehouseId })
      throw error
    }
  }

  /**
   * Obtener artículos sin stock
   */
  async findOutOfStock(warehouseId?: string): Promise<IItemWithStock[]> {
    try {
      const items = await prisma.item.findMany({
        where: {
          isActive: true,
        },
        include: {
          brand: true,
          category: true,
          unit: true,
          images: {
            where: { isPrimary: true },
            take: 1,
          },
          stocks: warehouseId
            ? {
                where: { warehouseId },
                include: {
                  warehouse: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              }
            : {
                include: {
                  warehouse: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
        },
      })

      // Filtrar artículos sin stock
      const outOfStockItems = items.filter((item: any) => {
        const totalAvailable = item.stocks.reduce(
          (sum: number, s: any) => sum + s.quantityAvailable,
          0
        )
        return totalAvailable === 0
      })

      return outOfStockItems as any
    } catch (error) {
      logger.error('Error finding out of stock items', { error, warehouseId })
      throw error
    }
  }

  /**
   * Obtener artículos por categoría (incluye subcategorías)
   */
  async findByCategory(
    categoryId: string,
    includeSubcategories: boolean = true
  ): Promise<IItemWithRelations[]> {
    try {
      // Verificar que la categoría existe
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      })

      if (!category) {
        throw new NotFoundError('Categoría no encontrada')
      }

      let categoryIds = [categoryId]

      // Si se incluyen subcategorías, obtener todas las descendientes
      if (includeSubcategories) {
        const descendants = await this.getCategoryDescendants(categoryId)
        categoryIds = [...categoryIds, ...descendants.map((d) => d.id)]
      }

      const items = await prisma.item.findMany({
        where: {
          categoryId: {
            in: categoryIds,
          },
          isActive: true,
        },
        orderBy: { name: 'asc' },
        include: {
          brand: true,
          category: true,
          model: true,
          unit: true,
          images: true,
          stocks: {
            select: {
              quantityReal: true,
              quantityAvailable: true,
              quantityReserved: true,
            },
          },
          _count: {
            select: {
              stocks: true,
              movements: true,
              images: true,
            },
          },
        },
      })

      return items as any
    } catch (error) {
      logger.error('Error finding items by category', { error, categoryId })
      throw error
    }
  }

  /**
   * Obtener descendientes de una categoría (helper)
   */
  private async getCategoryDescendants(categoryId: string): Promise<any[]> {
    const descendants: any[] = []
    const queue = [categoryId]

    while (queue.length > 0) {
      const currentId = queue.shift()!

      const children = await prisma.category.findMany({
        where: { parentId: currentId },
      })

      descendants.push(...children)
      queue.push(...children.map((c: any) => c.id))
    }

    return descendants
  }

  /**
   * Actualizar precios de un artículo
   */
  async updatePricing(
    id: string,
    data: {
      costPrice?: number
      salePrice?: number
      wholesalePrice?: number
      applyMargin?: boolean
      marginPercentage?: number
    },
    userId?: string
  ): Promise<IItemWithRelations> {
    try {
      const item = await this.findById(id, false)

      let costPrice = data.costPrice ?? item.costPrice
      let salePrice = data.salePrice ?? item.salePrice
      let wholesalePrice = data.wholesalePrice ?? item.wholesalePrice

      // Si se aplica margen, calcular precio de venta
      if (data.applyMargin && data.marginPercentage !== undefined) {
        salePrice = PriceCalculator.calculateSalePriceWithMargin(
          costPrice,
          data.marginPercentage
        )
      }

      // Validar que precio de venta sea mayor que costo
      if (salePrice < costPrice) {
        throw new BadRequestError(
          'El precio de venta debe ser mayor o igual al precio de costo'
        )
      }

      const updated = await prisma.item.update({
        where: { id },
        data: {
          costPrice,
          salePrice,
          ...(wholesalePrice !== undefined && { wholesalePrice }),
          historial: {
            action: 'UPDATE_PRICING',
            userId,
            timestamp: new Date().toISOString(),
            previousPrices: {
              costPrice: item.costPrice,
              salePrice: item.salePrice,
              wholesalePrice: item.wholesalePrice,
            },
            newPrices: {
              costPrice,
              salePrice,
              wholesalePrice,
            },
          },
        },
        include: {
          brand: true,
          category: true,
          model: true,
          unit: true,
          images: true,
          stocks: true,
          _count: {
            select: {
              stocks: true,
              movements: true,
              images: true,
            },
          },
        },
      })

      logger.info('Item pricing updated', { itemId: id, userId })

      return updated as any
    } catch (error) {
      logger.error('Error updating item pricing', { error, id, data, userId })
      throw error
    }
  }

  /**
   * Actualización masiva de artículos
   */
  async bulkUpdate(
    itemIds: string[],
    updates: {
      categoryId?: string
      isActive?: boolean
      tags?: string[]
      applyPriceIncrease?: number // Porcentaje
    },
    userId?: string
  ) {
    try {
      const results = {
        success: [] as any[],
        errors: [] as any[],
      }

      for (const itemId of itemIds) {
        try {
          const item = await this.findById(itemId, false)

          const updateData: any = {}

          if (updates.categoryId) {
            updateData.categoryId = updates.categoryId
          }

          if (updates.isActive !== undefined) {
            updateData.isActive = updates.isActive
          }

          if (updates.tags) {
            updateData.tags = updates.tags.map((tag) => tag.toLowerCase())
          }

          // Aplicar incremento de precio
          if (updates.applyPriceIncrease !== undefined) {
            const increase = updates.applyPriceIncrease / 100
            updateData.costPrice = Number(item.costPrice) * (1 + increase)
            updateData.salePrice = Number(item.salePrice) * (1 + increase)
            if (item.wholesalePrice) {
              updateData.wholesalePrice =
                Number(item.wholesalePrice) * (1 + increase)
            }
          }

          const updated = await prisma.item.update({
            where: { id: itemId },
            data: {
              ...updateData,
              historial: {
                action: 'BULK_UPDATE',
                userId,
                timestamp: new Date().toISOString(),
                updates,
              },
            },
          })

          results.success.push(updated)
        } catch (error: any) {
          results.errors.push({
            itemId,
            error: error.message,
          })
        }
      }

      logger.info('Bulk update completed', {
        total: itemIds.length,
        success: results.success.length,
        errors: results.errors.length,
        userId,
      })

      return results
    } catch (error) {
      logger.error('Error in bulk update', { error, itemIds, updates, userId })
      throw error
    }
  }

  /**
   * Importación masiva de artículos
   */
  async bulkCreate(items: ICreateItemInput[], userId?: string) {
    try {
      const results = {
        success: [] as any[],
        errors: [] as any[],
      }

      for (const itemData of items) {
        try {
          const item = await this.create(itemData, userId)
          results.success.push(item)
        } catch (error: any) {
          results.errors.push({
            sku: itemData.sku,
            name: itemData.name,
            error: error.message,
          })
        }
      }

      logger.info('Bulk item creation completed', {
        total: items.length,
        success: results.success.length,
        errors: results.errors.length,
        userId,
      })

      return results
    } catch (error) {
      logger.error('Error in bulk item creation', { error, userId })
      throw error
    }
  }

  /**
   * Generar SKU automático
   */
  async generateSKU(categoryCode: string, brandCode: string): Promise<string> {
    try {
      return await SKUGenerator.generate(categoryCode, brandCode)
    } catch (error) {
      logger.error('Error generating SKU', { error, categoryCode, brandCode })
      throw error
    }
  }

  /**
   * Obtener historial de cambios de un artículo
   */
  async getHistory(id: string): Promise<any[]> {
    try {
      const item = await prisma.item.findUnique({
        where: { id },
        select: {
          historial: true,
        },
      })

      if (!item) {
        throw new NotFoundError(INVENTORY_MESSAGES.item.notFound)
      }

      const historial = item.historial as any
      return Array.isArray(historial) ? historial : []
    } catch (error) {
      logger.error('Error getting item history', { error, id })
      throw error
    }
  }

  /**
   * Obtener estadísticas de un artículo
   */
  async getStats(id: string) {
    try {
      const item = await this.findById(id, true)

      // Calcular totales de stock
      const totalStock =
        (item as any).stocks?.reduce(
          (sum: number, s: any) => sum + s.quantityReal,
          0
        ) || 0

      const availableStock =
        (item as any).stocks?.reduce(
          (sum: number, s: any) => sum + s.quantityAvailable,
          0
        ) || 0

      const reservedStock =
        (item as any).stocks?.reduce(
          (sum: number, s: any) => sum + s.quantityReserved,
          0
        ) || 0

      // Obtener movimientos recientes
      const [recentMovements, totalMovements, lastSale, totalSales] =
        await Promise.all([
          prisma.movement.findMany({
            where: { itemId: id },
            take: 10,
            orderBy: { movementDate: 'desc' },
            include: {
              warehouseFrom: {
                select: { name: true },
              },
              warehouseTo: {
                select: { name: true },
              },
            },
          }),
          prisma.movement.count({
            where: { itemId: id },
          }),
          prisma.movement.findFirst({
            where: {
              itemId: id,
              type: 'SALE',
            },
            orderBy: { movementDate: 'desc' },
          }),
          prisma.movement.count({
            where: {
              itemId: id,
              type: 'SALE',
            },
          }),
        ])

      // Calcular margen
      const margin = PriceCalculator.calculateMargin(
        Number(item.costPrice),
        Number(item.salePrice)
      )

      // Calcular valor del inventario
      const inventoryValue = totalStock * Number(item.costPrice)

      return {
        item: {
          id: item.id,
          sku: item.sku,
          name: item.name,
        },
        stock: {
          total: totalStock,
          available: availableStock,
          reserved: reservedStock,
          status:
            availableStock === 0
              ? 'OUT_OF_STOCK'
              : availableStock <= item.minStock
                ? 'LOW_STOCK'
                : availableStock >= (item.maxStock || Infinity)
                  ? 'OVERSTOCK'
                  : 'NORMAL',
          byWarehouse: (item as any).stocks?.map((s: any) => ({
            warehouseId: s.warehouse.id,
            warehouseName: s.warehouse.name,
            quantityReal: s.quantityReal,
            quantityReserved: s.quantityReserved,
            quantityAvailable: s.quantityAvailable,
          })),
        },
        pricing: {
          costPrice: Number(item.costPrice),
          salePrice: Number(item.salePrice),
          wholesalePrice: item.wholesalePrice
            ? Number(item.wholesalePrice)
            : null,
          margin,
          inventoryValue,
        },
        movements: {
          total: totalMovements,
          recent: recentMovements,
          lastSale: lastSale
            ? {
                date: lastSale.movementDate,
                quantity: lastSale.quantity,
              }
            : null,
          totalSales,
        },
      }
    } catch (error) {
      logger.error('Error getting item stats', { error, id })
      throw error
    }
  }

  /**
   * Obtener artículos relacionados (misma categoría o marca)
   */
  async getRelatedItems(
    id: string,
    limit: number = 10
  ): Promise<IItemWithRelations[]> {
    try {
      const item = await this.findById(id, false)

      const relatedItems = await prisma.item.findMany({
        where: {
          id: { not: id },
          isActive: true,
          OR: [
            { categoryId: item.categoryId },
            { brandId: item.brandId },
            { modelId: item.modelId || null },
          ],
        },
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          brand: true,
          category: true,
          model: true,
          unit: true,
          images: {
            where: { isPrimary: true },
            take: 1,
          },
          stocks: {
            select: {
              quantityAvailable: true,
            },
          },
        },
      })

      return relatedItems as any
    } catch (error) {
      logger.error('Error getting related items', { error, id })
      throw error
    }
  }

  /**
   * Duplicar artículo
   */
  async duplicate(
    id: string,
    newSku: string,
    userId?: string
  ): Promise<IItemWithRelations> {
    try {
      const original = await this.findById(id, false)

      // Verificar que el nuevo SKU no exista
      const existingSku = await prisma.item.findUnique({
        where: { sku: newSku.toUpperCase() },
      })

      if (existingSku) {
        throw new ConflictError('El nuevo SKU ya existe')
      }

      // Crear copia
      const createData: any = {
        sku: newSku,
        name: `${original.name} (Copia)`,
        brandId: original.brandId,
        categoryId: original.categoryId,
        unitId: original.unitId,
        costPrice: Number(original.costPrice),
        salePrice: Number(original.salePrice),
        minStock: original.minStock,
        reorderPoint: original.reorderPoint,
        isActive: false,
        isSerialized: original.isSerialized,
        hasBatch: original.hasBatch,
        hasExpiry: original.hasExpiry,
        allowNegativeStock: original.allowNegativeStock,
      }
      if (original.description) createData.description = original.description
      if (original.modelId) createData.modelId = original.modelId
      if (original.location) createData.location = original.location
      if (original.wholesalePrice)
        createData.wholesalePrice = Number(original.wholesalePrice)
      if (original.maxStock) createData.maxStock = original.maxStock
      if (original.technicalSpecs)
        createData.technicalSpecs = original.technicalSpecs
      if (original.tags && original.tags.length > 0)
        createData.tags = original.tags

      const duplicated = await this.create(createData, userId)

      logger.info('Item duplicated', {
        originalId: id,
        duplicatedId: duplicated.id,
        userId,
      })

      return duplicated
    } catch (error) {
      logger.error('Error duplicating item', { error, id, newSku, userId })
      throw error
    }
  }

  /**
   * Verificar disponibilidad de stock para múltiples items
   */
  async checkAvailability(
    items: { itemId: string; quantity: number; warehouseId: string }[]
  ): Promise<{
    available: boolean
    details: {
      itemId: string
      itemName: string
      requested: number
      available: number
      sufficient: boolean
    }[]
  }> {
    try {
      const details = []
      let allAvailable = true

      for (const { itemId, quantity, warehouseId } of items) {
        const item = await this.findById(itemId, true)

        const stock = (item as any).stocks?.find(
          (s: any) => s.warehouse.id === warehouseId
        )

        const available = stock?.quantityAvailable || 0
        const sufficient = available >= quantity

        if (!sufficient) {
          allAvailable = false
        }

        details.push({
          itemId,
          itemName: item.name,
          requested: quantity,
          available,
          sufficient,
        })
      }

      return {
        available: allAvailable,
        details,
      }
    } catch (error) {
      logger.error('Error checking availability', { error, items })
      throw error
    }
  }
}

export default new ItemService()
