// backend/src/features/inventory/items/items.controller.ts

import { Request, Response } from 'express'
import itemService from './items.service.js'
import { CreateItemDTO, UpdateItemDTO, ItemResponseDTO } from './items.dto.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { INVENTORY_MESSAGES } from '../shared/constants/messages.js'

const MSG = INVENTORY_MESSAGES.item

function getEmpresaId(req: Request): string {
  if (!req.empresaId) throw new Error('empresaId not set by middleware')
  return req.empresaId
}

function getUserId(req: Request): string {
  return req.user?.userId ?? 'system'
}

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------

const getAll = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
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

  const filters: {
    search?: string
    brandId?: string
    categoryId?: string
    modelId?: string
    isActive?: boolean
    tags?: string[]
    minPrice?: number
    maxPrice?: number
  } = {}

  if (search) filters.search = search as string
  if (brandId) filters.brandId = brandId as string
  if (categoryId) filters.categoryId = categoryId as string
  if (modelId) filters.modelId = modelId as string
  if (isActive !== undefined) filters.isActive = isActive === 'true'
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
    req.prisma
  )

  const items = result.items.map(
    (i) =>
      new ItemResponseDTO(i, { includeRelations: true, includeStock: true })
  )
  return ApiResponse.paginated(
    res,
    items,
    result.page,
    result.limit,
    result.total
  )
})

const getActive = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const items = await itemService.findActive(
    empresaId,
    Number(req.query.limit) || 100,
    req.prisma
  )
  return ApiResponse.success(
    res,
    items.map(
      (i) =>
        new ItemResponseDTO(i, { includeRelations: true, includeStock: true })
    )
  )
})

const search = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const { term, limit } = req.query
  if (!term)
    return ApiResponse.badRequest(res, 'El término de búsqueda es requerido')
  const items = await itemService.search(
    empresaId,
    term as string,
    Number(limit) || 20,
    req.prisma
  )
  return ApiResponse.success(
    res,
    items.map(
      (i) =>
        new ItemResponseDTO(i, { includeRelations: true, includeStock: true })
    )
  )
})

const getLowStock = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const items = await itemService.findLowStock(
    empresaId,
    req.prisma,
    req.query.warehouseId as string | undefined
  )
  return ApiResponse.success(
    res,
    items.map(
      (i) =>
        new ItemResponseDTO(i, { includeRelations: true, includeStock: true })
    )
  )
})

const getOutOfStock = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const items = await itemService.findOutOfStock(
    empresaId,
    req.prisma,
    req.query.warehouseId as string | undefined
  )
  return ApiResponse.success(
    res,
    items.map(
      (i) =>
        new ItemResponseDTO(i, { includeRelations: true, includeStock: true })
    )
  )
})

const getByCategory = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const categoryId = req.params.categoryId as string
  const items = await itemService.findByCategory(
    empresaId,
    categoryId,
    req.query.includeSubcategories !== 'false',
    req.prisma
  )
  return ApiResponse.success(
    res,
    items.map(
      (i) =>
        new ItemResponseDTO(i, { includeRelations: true, includeStock: true })
    )
  )
})

const getBySku = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const item = await itemService.findBySku(
    empresaId,
    req.params.sku as string,
    req.prisma
  )
  if (!item) return ApiResponse.notFound(res, MSG.notFound)
  return ApiResponse.success(
    res,
    new ItemResponseDTO(item, { includeRelations: true, includeStock: true })
  )
})

const getByBarcode = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const item = await itemService.findByBarcode(
    empresaId,
    req.params.barcode as string,
    req.prisma
  )
  if (!item) return ApiResponse.notFound(res, MSG.notFound)
  return ApiResponse.success(
    res,
    new ItemResponseDTO(item, { includeRelations: true, includeStock: true })
  )
})

const getById = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const item = await itemService.findById(
    empresaId,
    req.params.id as string,
    true,
    req.prisma
  )
  return ApiResponse.success(
    res,
    new ItemResponseDTO(item, { includeRelations: true, includeStock: true })
  )
})

const getStats = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const stats = await itemService.getStats(
    empresaId,
    req.params.id as string,
    req.prisma
  )
  return ApiResponse.success(res, stats)
})

const getHistory = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const history = await itemService.getHistory(
    empresaId,
    req.params.id as string,
    req.prisma
  )
  return ApiResponse.success(res, history)
})

const getRelatedItems = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const items = await itemService.getRelatedItems(
    empresaId,
    req.params.id as string,
    Number(req.query.limit) || 10,
    req.prisma
  )
  return ApiResponse.success(
    res,
    items.map(
      (i) =>
        new ItemResponseDTO(i, { includeRelations: true, includeStock: true })
    )
  )
})

// ---------------------------------------------------------------------------
// POST
// ---------------------------------------------------------------------------

const create = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const item = await itemService.create(
    empresaId,
    new CreateItemDTO(req.body) as never,
    getUserId(req),
    req.prisma
  )
  return ApiResponse.created(
    res,
    new ItemResponseDTO(item, { includeRelations: true }),
    MSG.created
  )
})

const bulkCreate = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const { items } = req.body as { items: unknown[] }
  if (!Array.isArray(items) || items.length === 0) {
    return ApiResponse.badRequest(
      res,
      'Debe proporcionar un array de artículos'
    )
  }
  const result = await itemService.bulkCreate(
    empresaId,
    items.map((i) => new CreateItemDTO(i) as never),
    getUserId(req),
    req.prisma
  )
  return ApiResponse.success(
    res,
    result,
    `Importación completada. Éxitos: ${result.success.length}, Errores: ${result.errors.length}`
  )
})

const generateSku = asyncHandler(async (req: Request, res: Response) => {
  const { categoryCode, brandCode } = req.body as {
    categoryCode: string
    brandCode: string
  }
  if (!categoryCode || !brandCode)
    return ApiResponse.badRequest(res, 'Se requieren categoryCode y brandCode')
  return ApiResponse.success(res, {
    sku: itemService.generateSKU(categoryCode, brandCode),
  })
})

const checkAvailability = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const { items } = req.body as {
    items: { itemId: string; quantity: number; warehouseId: string }[]
  }
  if (!Array.isArray(items))
    return ApiResponse.badRequest(res, 'Debe proporcionar un array de items')
  const result = await itemService.checkAvailability(
    empresaId,
    items,
    req.prisma
  )
  const msg = result.available
    ? 'Todos los artículos están disponibles'
    : 'Algunos artículos no tienen stock suficiente'
  return ApiResponse.success(res, result, msg)
})

const duplicate = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const { newSku } = req.body as { newSku: string }
  if (!newSku) return ApiResponse.badRequest(res, 'El nuevo SKU es requerido')
  const item = await itemService.duplicate(
    empresaId,
    req.params.id as string,
    newSku,
    getUserId(req),
    req.prisma
  )
  return ApiResponse.created(
    res,
    new ItemResponseDTO(item, { includeRelations: true }),
    'Artículo duplicado exitosamente'
  )
})

// ---------------------------------------------------------------------------
// PUT / PATCH
// ---------------------------------------------------------------------------

const update = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const item = await itemService.update(
    empresaId,
    req.params.id as string,
    new UpdateItemDTO(req.body) as never,
    getUserId(req),
    req.prisma
  )
  return ApiResponse.success(
    res,
    new ItemResponseDTO(item, { includeRelations: true }),
    MSG.updated
  )
})

const updatePricing = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const item = await itemService.updatePricing(
    empresaId,
    req.params.id as string,
    req.body,
    getUserId(req),
    req.prisma
  )
  return ApiResponse.success(
    res,
    new ItemResponseDTO(item, { includeRelations: true }),
    'Precios actualizados exitosamente'
  )
})

const bulkUpdate = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const { itemIds, updates } = req.body as {
    itemIds: string[]
    updates: Record<string, unknown>
  }
  if (!Array.isArray(itemIds) || itemIds.length === 0)
    return ApiResponse.badRequest(res, 'Debe proporcionar un array de IDs')
  if (!updates || Object.keys(updates).length === 0)
    return ApiResponse.badRequest(
      res,
      'Debe proporcionar al menos un campo para actualizar'
    )
  const result = await itemService.bulkUpdate(
    empresaId,
    itemIds,
    updates as never,
    getUserId(req),
    req.prisma
  )
  return ApiResponse.success(
    res,
    result,
    `Actualización masiva completada. Éxitos: ${result.success.length}, Errores: ${result.errors.length}`
  )
})

const toggleActive = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const item = await itemService.toggleActive(
    empresaId,
    req.params.id as string,
    getUserId(req),
    req.prisma
  )
  const message = item.isActive
    ? 'Artículo activado exitosamente'
    : 'Artículo desactivado exitosamente'
  return ApiResponse.success(
    res,
    new ItemResponseDTO(item, { includeRelations: true }),
    message
  )
})

// ---------------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------------

const deleteItem = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  await itemService.delete(
    empresaId,
    req.params.id as string,
    getUserId(req),
    req.prisma
  )
  return ApiResponse.success(res, null, MSG.deleted)
})

const hardDelete = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  await itemService.hardDelete(
    empresaId,
    req.params.id as string,
    getUserId(req),
    req.prisma
  )
  return ApiResponse.success(res, null, 'Artículo eliminado permanentemente')
})

export default {
  getAll,
  getActive,
  search,
  getLowStock,
  getOutOfStock,
  getByCategory,
  getBySku,
  getByBarcode,
  getById,
  getStats,
  getHistory,
  getRelatedItems,
  create,
  bulkCreate,
  generateSku,
  checkAvailability,
  duplicate,
  update,
  updatePricing,
  bulkUpdate,
  toggleActive,
  delete: deleteItem,
  hardDelete,
}
