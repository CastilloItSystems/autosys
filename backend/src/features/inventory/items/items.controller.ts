// backend/src/features/inventory/items/items.controller.ts

import { Request, Response } from 'express'
import { ItemService } from './items.service'
import { CreateItemDTO, UpdateItemDTO, ItemResponseDTO } from './items.dto'
import { ApiResponse } from '../../../shared/utils/ApiResponse'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware'
import { INVENTORY_MESSAGES } from '../shared/constants/messages'

const itemService = new ItemService()

export class ItemController {
  /**
   * GET /api/inventory/items
   * Obtener todos los artículos con filtros
   */
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const {
      page,
      limit,
      search,
      brandId,
      categoryId,
      modelId,
      isActive,
      tags,
      minPrice,
      maxPrice,
      inStock,
      lowStock,
      sortBy,
      sortOrder,
    } = req.query

    const filters: any = {}
    if (search) filters.search = search as string
    if (brandId) filters.brandId = brandId as string
    if (categoryId) filters.categoryId = categoryId as string
    if (modelId) filters.modelId = modelId as string
    if (isActive !== undefined)
      filters.isActive =
        isActive === 'true' ? true : isActive === 'false' ? false : undefined
    if (tags) filters.tags = (Array.isArray(tags) ? tags : [tags]) as string[]
    if (minPrice) filters.minPrice = Number(minPrice)
    if (maxPrice) filters.maxPrice = Number(maxPrice)
    if (inStock === 'true') filters.inStock = true
    if (lowStock === 'true') filters.lowStock = true

    // Pasar req.prisma al service para que use el Prisma client extendido con contexto de empresa
    const result = await itemService.findAll(
      filters,
      Number(page) || 1,
      Number(limit) || 10,
      (sortBy as string) || 'name',
      (sortOrder as 'asc' | 'desc') || 'asc',
      req.prisma || undefined // Pasar Prisma client extendido si está disponible
    )

    const items = result.items.map(
      (item: any) =>
        new ItemResponseDTO(item, {
          includeRelations: true,
          includeStock: true,
        })
    )

    return ApiResponse.paginated(
      res,
      items,
      result.page,
      result.limit,
      result.total,
      'Artículos obtenidos exitosamente'
    )
  })

  /**
   * GET /api/inventory/items/active
   * Obtener artículos activos
   */
  getActive = asyncHandler(async (req: Request, res: Response) => {
    const { limit } = req.query

    const items = await itemService.findActive(Number(limit) || 100)
    const response = items.map(
      (item) =>
        new ItemResponseDTO(item, {
          includeRelations: true,
          includeStock: true,
        })
    )

    return ApiResponse.paginated(
      res,
      response,
      1,
      response.length,
      response.length,
      'Artículos activos obtenidos exitosamente'
    )
  })

  /**
   * GET /api/inventory/items/search
   * Buscar artículos
   */
  search = asyncHandler(async (req: Request, res: Response) => {
    const { term, limit } = req.query

    if (!term) {
      return ApiResponse.badRequest(res, 'El término de búsqueda es requerido')
    }

    const items = await itemService.search(term as string, Number(limit) || 20)
    const response = items.map(
      (item) =>
        new ItemResponseDTO(item, {
          includeRelations: true,
          includeStock: true,
        })
    )

    return ApiResponse.paginated(
      res,
      response,
      1,
      response.length,
      response.length,
      'Búsqueda completada'
    )
  })

  /**
   * GET /api/inventory/items/low-stock
   * Obtener artículos con stock bajo
   */
  getLowStock = asyncHandler(async (req: Request, res: Response) => {
    const { warehouseId } = req.query

    const items = await itemService.findLowStock(warehouseId as string)
    const response = items.map(
      (item) =>
        new ItemResponseDTO(item, {
          includeRelations: true,
          includeStock: true,
        })
    )

    return ApiResponse.success(
      res,
      response,
      'Artículos con stock bajo obtenidos exitosamente'
    )
  })

  /**
   * GET /api/inventory/items/out-of-stock
   * Obtener artículos sin stock
   */
  getOutOfStock = asyncHandler(async (req: Request, res: Response) => {
    const { warehouseId } = req.query

    const items = await itemService.findOutOfStock(warehouseId as string)
    const response = items.map(
      (item) =>
        new ItemResponseDTO(item, {
          includeRelations: true,
          includeStock: true,
        })
    )

    return ApiResponse.success(
      res,
      response,
      'Artículos sin stock obtenidos exitosamente'
    )
  })

  /**
   * GET /api/inventory/items/category/:categoryId
   * Obtener artículos por categoría
   */
  getByCategory = asyncHandler(async (req: Request, res: Response) => {
    const { categoryId } = req.params as { categoryId: string }
    const { includeSubcategories } = req.query

    const items = await itemService.findByCategory(
      categoryId,
      includeSubcategories !== 'false'
    )
    const response = items.map(
      (item) =>
        new ItemResponseDTO(item, {
          includeRelations: true,
          includeStock: true,
        })
    )

    return ApiResponse.success(
      res,
      response,
      'Artículos de la categoría obtenidos exitosamente'
    )
  })

  /**
   * GET /api/inventory/items/sku/:sku
   * Obtener artículo por SKU
   */
  getBySku = asyncHandler(async (req: Request, res: Response) => {
    const { sku } = req.params as { sku: string }

    const item = await itemService.findBySku(sku)

    if (!item) {
      return ApiResponse.notFound(res, 'Artículo no encontrado')
    }

    const response = new ItemResponseDTO(item, {
      includeRelations: true,
      includeStock: true,
    })

    return ApiResponse.success(res, response, 'Artículo obtenido exitosamente')
  })

  /**
   * GET /api/inventory/items/barcode/:barcode
   * Obtener artículo por código de barras
   */
  getByBarcode = asyncHandler(async (req: Request, res: Response) => {
    const { barcode } = req.params as { barcode: string }

    const item = await itemService.findByBarcode(barcode)

    if (!item) {
      return ApiResponse.notFound(res, 'Artículo no encontrado')
    }

    const response = new ItemResponseDTO(item, {
      includeRelations: true,
      includeStock: true,
    })

    return ApiResponse.success(res, response, 'Artículo obtenido exitosamente')
  })

  /**
   * GET /api/inventory/items/:id
   * Obtener artículo por ID
   */
  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }

    const item = await itemService.findById(id, true)
    const response = new ItemResponseDTO(item, {
      includeRelations: true,
      includeStock: true,
    })

    return ApiResponse.success(res, response, 'Artículo obtenido exitosamente')
  })

  /**
   * GET /api/inventory/items/:id/stats
   * Obtener estadísticas de un artículo
   */
  getStats = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }

    const stats = await itemService.getStats(id)

    return ApiResponse.success(
      res,
      stats,
      'Estadísticas obtenidas exitosamente'
    )
  })

  /**
   * GET /api/inventory/items/:id/history
   * Obtener historial de cambios
   */
  getHistory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }

    const history = await itemService.getHistory(id)

    return ApiResponse.success(res, history, 'Historial obtenido exitosamente')
  })

  /**
   * GET /api/inventory/items/:id/related
   * Obtener artículos relacionados
   */
  getRelatedItems = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const { limit } = req.query

    const items = await itemService.getRelatedItems(id, Number(limit) || 10)
    const response = items.map(
      (item) =>
        new ItemResponseDTO(item, {
          includeRelations: true,
          includeStock: true,
        })
    )

    return ApiResponse.success(
      res,
      response,
      'Artículos relacionados obtenidos exitosamente'
    )
  })

  /**
   * POST /api/inventory/items
   * Crear nuevo artículo
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const dto = new CreateItemDTO(req.body)
    const userId = req.user?.userId

    const item = await itemService.create(dto, userId)
    const response = new ItemResponseDTO(item, { includeRelations: true })

    return ApiResponse.created(res, response, INVENTORY_MESSAGES.item.created)
  })

  /**
   * POST /api/inventory/items/bulk
   * Importación masiva de artículos
   */
  bulkCreate = asyncHandler(async (req: Request, res: Response) => {
    const { items } = req.body
    const userId = req.user?.userId

    if (!items || !Array.isArray(items) || items.length === 0) {
      return ApiResponse.badRequest(
        res,
        'Debe proporcionar un array de artículos'
      )
    }

    const dtos = items.map((i) => new CreateItemDTO(i))
    const result = await itemService.bulkCreate(dtos, userId)

    return ApiResponse.success(
      res,
      result,
      `Importación completada. Éxitos: ${result.success.length}, Errores: ${result.errors.length}`
    )
  })

  /**
   * POST /api/inventory/items/generate-sku
   * Generar SKU automático
   */
  generateSku = asyncHandler(async (req: Request, res: Response) => {
    const { categoryCode, brandCode } = req.body

    if (!categoryCode || !brandCode) {
      return ApiResponse.badRequest(
        res,
        'Se requieren categoryCode y brandCode'
      )
    }

    const sku = await itemService.generateSKU(categoryCode, brandCode)

    return ApiResponse.success(res, { sku }, 'SKU generado exitosamente')
  })

  /**
   * POST /api/inventory/items/check-availability
   * Verificar disponibilidad de múltiples items
   */
  checkAvailability = asyncHandler(async (req: Request, res: Response) => {
    const { items } = req.body

    if (!items || !Array.isArray(items)) {
      return ApiResponse.badRequest(
        res,
        'Debe proporcionar un array de items con itemId, quantity y warehouseId'
      )
    }

    const result = await itemService.checkAvailability(items)

    return ApiResponse.success(
      res,
      result,
      result.available
        ? 'Todos los artículos están disponibles'
        : 'Algunos artículos no tienen stock suficiente'
    )
  })

  /**
   * POST /api/inventory/items/:id/duplicate
   * Duplicar artículo
   */
  duplicate = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const { newSku } = req.body
    const userId = req.user?.userId

    if (!newSku) {
      return ApiResponse.badRequest(res, 'El nuevo SKU es requerido')
    }

    const item = await itemService.duplicate(id, newSku, userId)
    const response = new ItemResponseDTO(item, { includeRelations: true })

    return ApiResponse.created(res, response, 'Artículo duplicado exitosamente')
  })

  /**
   * PUT /api/inventory/items/:id
   * Actualizar artículo
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const dto = new UpdateItemDTO(req.body)
    const userId = req.user?.userId

    const item = await itemService.update(id, dto, userId)
    const response = new ItemResponseDTO(item, { includeRelations: true })

    return ApiResponse.success(res, response, INVENTORY_MESSAGES.item.updated)
  })

  /**
   * PUT /api/inventory/items/:id/pricing
   * Actualizar precios de un artículo
   */
  updatePricing = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const userId = req.user?.userId

    const item = await itemService.updatePricing(id, req.body, userId)
    const response = new ItemResponseDTO(item, { includeRelations: true })

    return ApiResponse.success(
      res,
      response,
      'Precios actualizados exitosamente'
    )
  })

  /**
   * PUT /api/inventory/items/bulk-update
   * Actualización masiva de artículos
   */
  bulkUpdate = asyncHandler(async (req: Request, res: Response) => {
    const { itemIds, updates } = req.body
    const userId = req.user?.userId

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return ApiResponse.badRequest(
        res,
        'Debe proporcionar un array de IDs de artículos'
      )
    }

    if (!updates || Object.keys(updates).length === 0) {
      return ApiResponse.badRequest(
        res,
        'Debe proporcionar al menos un campo para actualizar'
      )
    }

    const result = await itemService.bulkUpdate(itemIds, updates, userId)

    return ApiResponse.success(
      res,
      result,
      `Actualización masiva completada. Éxitos: ${result.success.length}, Errores: ${result.errors.length}`
    )
  })

  /**
   * PATCH /api/inventory/items/:id/toggle
   * Activar/Desactivar artículo
   */
  toggleActive = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const userId = req.user?.userId

    const item = await itemService.toggleActive(id, userId)
    const response = new ItemResponseDTO(item, { includeRelations: true })

    const message = item.isActive
      ? 'Artículo activado exitosamente'
      : 'Artículo desactivado exitosamente'

    return ApiResponse.success(res, response, message)
  })

  /**
   * DELETE /api/inventory/items/:id
   * Eliminar artículo (soft delete)
   */
  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const userId = req.user?.userId

    await itemService.delete(id, userId)

    return ApiResponse.success(res, null, INVENTORY_MESSAGES.item.deleted)
  })

  /**
   * DELETE /api/inventory/items/:id/hard
   * Eliminar artículo permanentemente
   */
  hardDelete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const userId = req.user?.userId

    await itemService.hardDelete(id, userId)

    return ApiResponse.success(res, null, 'Artículo eliminado permanentemente')
  })
}

export default new ItemController()
