// backend/src/features/inventory/items/items.controller.ts
import { Request, Response } from 'express'
import { ItemService } from './items.service.js'
import { CreateItemDTO, UpdateItemDTO, ItemResponseDTO } from './items.dto.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { INVENTORY_MESSAGES } from '../shared/constants/messages.js'

const itemService = new ItemService()

const getTenantContext = (req: Request) => {
  const empresaId = req.empresaId
  if (!empresaId) {
    throw new Error(
      'empresaId no disponible en request. ¿Falta extractEmpresa?'
    )
  }
  return { empresaId, db: req.prisma || undefined }
}

export class ItemController {
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const { empresaId, db } = getTenantContext(req)
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
      sortBy,
      sortOrder,
    } = req.query

    const filters: any = {}
    if (search) filters.search = search as string
    if (brandId) filters.brandId = brandId as string
    if (categoryId) filters.categoryId = categoryId as string
    if (modelId) filters.modelId = modelId as string
    if (isActive !== undefined) {
      filters.isActive =
        isActive === 'true' ? true : isActive === 'false' ? false : undefined
    }
    if (tags) filters.tags = (Array.isArray(tags) ? tags : [tags]) as string[]
    if (minPrice) filters.minPrice = Number(minPrice)
    if (maxPrice) filters.maxPrice = Number(maxPrice)

    const result = await itemService.findAll(
      empresaId,
      filters,
      Number(page) || 1,
      Number(limit) || 10,
      (sortBy as string) || 'name',
      (sortOrder as 'asc' | 'desc') || 'asc',
      db
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

  getActive = asyncHandler(async (req: Request, res: Response) => {
    const { empresaId, db } = getTenantContext(req)
    const { limit } = req.query

    const items = await itemService.findActive(
      empresaId,
      Number(limit) || 100,
      db
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
      'Artículos activos obtenidos exitosamente'
    )
  })

  search = asyncHandler(async (req: Request, res: Response) => {
    const { empresaId, db } = getTenantContext(req)
    const { term, limit } = req.query

    if (!term) {
      return ApiResponse.badRequest(res, 'El término de búsqueda es requerido')
    }

    const items = await itemService.search(
      empresaId,
      term as string,
      Number(limit) || 20,
      db
    )

    const response = items.map(
      (item) =>
        new ItemResponseDTO(item, {
          includeRelations: true,
          includeStock: true,
        })
    )

    return ApiResponse.success(res, response, 'Búsqueda completada')
  })

  getLowStock = asyncHandler(async (req: Request, res: Response) => {
    const { empresaId, db } = getTenantContext(req)
    const { warehouseId } = req.query

    const items = await itemService.findLowStock(
      empresaId,
      warehouseId as string,
      db
    )
    const response = items.map(
      (item: any) =>
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

  getOutOfStock = asyncHandler(async (req: Request, res: Response) => {
    const { empresaId, db } = getTenantContext(req)
    const { warehouseId } = req.query

    const items = await itemService.findOutOfStock(
      empresaId,
      warehouseId as string,
      db
    )
    const response = items.map(
      (item: any) =>
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

  getByCategory = asyncHandler(async (req: Request, res: Response) => {
    const { empresaId, db } = getTenantContext(req)
    const { categoryId } = req.params as { categoryId: string }
    const { includeSubcategories } = req.query

    const items = await itemService.findByCategory(
      empresaId,
      categoryId,
      includeSubcategories !== 'false',
      db
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

  getBySku = asyncHandler(async (req: Request, res: Response) => {
    const { empresaId, db } = getTenantContext(req)
    const { sku } = req.params as { sku: string }

    const item = await itemService.findBySku(empresaId, sku, db)
    if (!item) return ApiResponse.notFound(res, 'Artículo no encontrado')

    const response = new ItemResponseDTO(item, {
      includeRelations: true,
      includeStock: true,
    })

    return ApiResponse.success(res, response, 'Artículo obtenido exitosamente')
  })

  getByBarcode = asyncHandler(async (req: Request, res: Response) => {
    const { empresaId, db } = getTenantContext(req)
    const { barcode } = req.params as { barcode: string }

    const item = await itemService.findByBarcode(empresaId, barcode, db)
    if (!item) return ApiResponse.notFound(res, 'Artículo no encontrado')

    const response = new ItemResponseDTO(item, {
      includeRelations: true,
      includeStock: true,
    })

    return ApiResponse.success(res, response, 'Artículo obtenido exitosamente')
  })

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { empresaId, db } = getTenantContext(req)
    const { id } = req.params as { id: string }

    const item = await itemService.findById(empresaId, id, true, db)
    const response = new ItemResponseDTO(item, {
      includeRelations: true,
      includeStock: true,
    })

    return ApiResponse.success(res, response, 'Artículo obtenido exitosamente')
  })

  getStats = asyncHandler(async (req: Request, res: Response) => {
    const { empresaId, db } = getTenantContext(req)
    const { id } = req.params as { id: string }

    const stats = await itemService.getStats(empresaId, id, db)
    return ApiResponse.success(
      res,
      stats,
      'Estadísticas obtenidas exitosamente'
    )
  })

  getHistory = asyncHandler(async (req: Request, res: Response) => {
    const { empresaId, db } = getTenantContext(req)
    const { id } = req.params as { id: string }

    const history = await itemService.getHistory(empresaId, id, db)
    return ApiResponse.success(res, history, 'Historial obtenido exitosamente')
  })

  getRelatedItems = asyncHandler(async (req: Request, res: Response) => {
    const { empresaId, db } = getTenantContext(req)
    const { id } = req.params as { id: string }
    const { limit } = req.query

    const items = await itemService.getRelatedItems(
      empresaId,
      id,
      Number(limit) || 10,
      db
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
      'Artículos relacionados obtenidos exitosamente'
    )
  })

  create = asyncHandler(async (req: Request, res: Response) => {
    const { empresaId, db } = getTenantContext(req)
    const dto = new CreateItemDTO(req.body)
    const userId = req.user?.userId

    const item = await itemService.create(empresaId, dto as any, userId, db)
    const response = new ItemResponseDTO(item, { includeRelations: true })

    return ApiResponse.created(res, response, INVENTORY_MESSAGES.item.created)
  })

  bulkCreate = asyncHandler(async (req: Request, res: Response) => {
    const { empresaId, db } = getTenantContext(req)
    const { items } = req.body
    const userId = req.user?.userId

    if (!items || !Array.isArray(items) || items.length === 0) {
      return ApiResponse.badRequest(
        res,
        'Debe proporcionar un array de artículos'
      )
    }

    const dtos = items.map((i) => new CreateItemDTO(i))
    const result = await itemService.bulkCreate(
      empresaId,
      dtos as any,
      userId,
      db
    )

    return ApiResponse.success(
      res,
      result,
      `Importación completada. Éxitos: ${result.success.length}, Errores: ${result.errors.length}`
    )
  })

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

  checkAvailability = asyncHandler(async (req: Request, res: Response) => {
    const { empresaId, db } = getTenantContext(req)
    const { items } = req.body

    if (!items || !Array.isArray(items)) {
      return ApiResponse.badRequest(
        res,
        'Debe proporcionar un array de items con itemId, quantity y warehouseId'
      )
    }

    const result = await itemService.checkAvailability(empresaId, items, db)
    return ApiResponse.success(
      res,
      result,
      result.available
        ? 'Todos los artículos están disponibles'
        : 'Algunos artículos no tienen stock suficiente'
    )
  })

  duplicate = asyncHandler(async (req: Request, res: Response) => {
    const { empresaId, db } = getTenantContext(req)
    const { id } = req.params as { id: string }
    const { newSku } = req.body
    const userId = req.user?.userId

    if (!newSku) return ApiResponse.badRequest(res, 'El nuevo SKU es requerido')

    const item = await itemService.duplicate(empresaId, id, newSku, userId, db)
    const response = new ItemResponseDTO(item, { includeRelations: true })

    return ApiResponse.created(res, response, 'Artículo duplicado exitosamente')
  })

  update = asyncHandler(async (req: Request, res: Response) => {
    const { empresaId, db } = getTenantContext(req)
    const { id } = req.params as { id: string }
    const dto = new UpdateItemDTO(req.body)
    const userId = req.user?.userId

    const item = await itemService.update(empresaId, id, dto as any, userId, db)
    const response = new ItemResponseDTO(item, { includeRelations: true })

    return ApiResponse.success(res, response, INVENTORY_MESSAGES.item.updated)
  })

  updatePricing = asyncHandler(async (req: Request, res: Response) => {
    const { empresaId, db } = getTenantContext(req)
    const { id } = req.params as { id: string }
    const userId = req.user?.userId

    const item = await itemService.updatePricing(
      empresaId,
      id,
      req.body,
      userId,
      db
    )
    const response = new ItemResponseDTO(item, { includeRelations: true })

    return ApiResponse.success(
      res,
      response,
      'Precios actualizados exitosamente'
    )
  })

  bulkUpdate = asyncHandler(async (req: Request, res: Response) => {
    const { empresaId, db } = getTenantContext(req)
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

    const result = await itemService.bulkUpdate(
      empresaId,
      itemIds,
      updates,
      userId,
      db
    )

    return ApiResponse.success(
      res,
      result,
      `Actualización masiva completada. Éxitos: ${result.success.length}, Errores: ${result.errors.length}`
    )
  })

  toggleActive = asyncHandler(async (req: Request, res: Response) => {
    const { empresaId, db } = getTenantContext(req)
    const { id } = req.params as { id: string }
    const userId = req.user?.userId

    const item = await itemService.toggleActive(empresaId, id, userId, db)
    const response = new ItemResponseDTO(item, { includeRelations: true })
    const message = item.isActive
      ? 'Artículo activado exitosamente'
      : 'Artículo desactivado exitosamente'

    return ApiResponse.success(res, response, message)
  })

  delete = asyncHandler(async (req: Request, res: Response) => {
    const { empresaId, db } = getTenantContext(req)
    const { id } = req.params as { id: string }
    const userId = req.user?.userId

    await itemService.delete(empresaId, id, userId, db)
    return ApiResponse.success(res, null, INVENTORY_MESSAGES.item.deleted)
  })

  hardDelete = asyncHandler(async (req: Request, res: Response) => {
    const { empresaId, db } = getTenantContext(req)
    const { id } = req.params as { id: string }
    const userId = req.user?.userId

    await itemService.hardDelete(empresaId, id, userId, db)
    return ApiResponse.success(res, null, 'Artículo eliminado permanentemente')
  })
}

export default new ItemController()
