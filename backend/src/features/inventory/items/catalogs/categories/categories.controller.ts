// backend/src/features/inventory/items/catalogs/categories/categories.controller.ts

import { Request, Response } from 'express'
import categoryService from './categories.service.js'
import {
  CreateCategoryDTO,
  UpdateCategoryDTO,
  CategoryResponseDTO,
  CategoryTreeResponseDTO,
} from './categories.dto.js'
import { ApiResponse } from '../../../../../shared/utils/apiResponse.js'
import { asyncHandler } from '../../../../../shared/middleware/asyncHandler.middleware.js'
import { INVENTORY_MESSAGES } from '../../../shared/constants/messages.js'

const MSG = INVENTORY_MESSAGES.category

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
  const { page, limit, search, isActive, parentId, hasParent } = req.query

  const filters: {
    search?: string
    isActive?: boolean
    parentId?: string
    hasParent?: boolean
  } = {}
  if (search) filters.search = search as string
  if (isActive === 'true') filters.isActive = true
  if (isActive === 'false') filters.isActive = false
  if (parentId) filters.parentId = parentId as string
  if (hasParent === 'true') filters.hasParent = true
  if (hasParent === 'false') filters.hasParent = false

  const result = await categoryService.findAll(
    empresaId,
    filters,
    Number(page) || 1,
    Number(limit) || 10,
    req.prisma
  )
  const categories = result.categories.map(
    (c) => new CategoryResponseDTO(c, { includeRelations: true })
  )

  return ApiResponse.paginated(
    res,
    categories,
    result.page,
    result.limit,
    result.total
  )
})

const getTree = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const tree = await categoryService.getTree(empresaId, req.prisma)
  return ApiResponse.success(
    res,
    tree.map((c) => new CategoryTreeResponseDTO(c))
  )
})

const getRootCategories = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const categories = await categoryService.getRootCategories(
    empresaId,
    req.prisma
  )
  return ApiResponse.success(
    res,
    categories.map(
      (c) => new CategoryResponseDTO(c, { includeRelations: true })
    )
  )
})

const getActive = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const categories = await categoryService.findActive(empresaId, req.prisma)
  return ApiResponse.success(
    res,
    categories.map(
      (c) => new CategoryResponseDTO(c, { includeRelations: false })
    )
  )
})

const search = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const { term, limit } = req.query

  if (!term)
    return ApiResponse.badRequest(res, 'El término de búsqueda es requerido')

  const categories = await categoryService.search(
    empresaId,
    term as string,
    req.prisma,
    Number(limit) || 10
  )
  return ApiResponse.success(
    res,
    categories.map(
      (c) => new CategoryResponseDTO(c, { includeRelations: true })
    )
  )
})

const getById = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const category = await categoryService.findById(
    empresaId,
    req.params.id as string,
    req.prisma
  )
  return ApiResponse.success(
    res,
    new CategoryResponseDTO(category, { includeRelations: true })
  )
})

const getSubTree = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const tree = await categoryService.getSubTree(
    empresaId,
    req.params.id as string,
    req.prisma
  )
  return ApiResponse.success(res, new CategoryTreeResponseDTO(tree))
})

const getChildren = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const children = await categoryService.getChildren(
    empresaId,
    req.params.id as string,
    req.prisma
  )
  return ApiResponse.success(
    res,
    children.map((c) => new CategoryResponseDTO(c, { includeRelations: false }))
  )
})

const getAncestors = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const ancestors = await categoryService.getAncestors(
    empresaId,
    req.params.id as string,
    req.prisma
  )
  return ApiResponse.success(
    res,
    ancestors.map(
      (c) => new CategoryResponseDTO(c, { includeRelations: false })
    )
  )
})

const getPath = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const path = await categoryService.getPath(
    empresaId,
    req.params.id as string,
    req.prisma
  )
  return ApiResponse.success(
    res,
    path.map((c) => new CategoryResponseDTO(c, { includeRelations: false }))
  )
})

const getStats = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const stats = await categoryService.getStats(
    empresaId,
    req.params.id as string,
    req.prisma
  )
  return ApiResponse.success(res, stats)
})

// ---------------------------------------------------------------------------
// POST
// ---------------------------------------------------------------------------

const create = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const category = await categoryService.create(
    empresaId,
    new CreateCategoryDTO(req.body) as never,
    getUserId(req),
    req.prisma
  )
  return ApiResponse.created(
    res,
    new CategoryResponseDTO(category, { includeRelations: true }),
    MSG.created
  )
})

const bulkCreate = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const { categories } = req.body

  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    return ApiResponse.badRequest(
      res,
      'Debe proporcionar un array de categorías'
    )
  }

  const result = await categoryService.bulkCreate(
    empresaId,
    categories.map((c: unknown) => new CreateCategoryDTO(c) as never),
    getUserId(req),
    req.prisma
  )

  return ApiResponse.success(
    res,
    result,
    `Importación completada. Éxitos: ${result.success.length}, Errores: ${result.errors.length}`
  )
})

// ---------------------------------------------------------------------------
// PUT / PATCH
// ---------------------------------------------------------------------------

const update = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const category = await categoryService.update(
    empresaId,
    req.params.id as string,
    new UpdateCategoryDTO(req.body) as never,
    getUserId(req),
    req.prisma
  )
  return ApiResponse.success(
    res,
    new CategoryResponseDTO(category, { includeRelations: true }),
    MSG.updated
  )
})

const move = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const { parentId } = req.body
  const category = await categoryService.move(
    empresaId,
    req.params.id as string,
    parentId ?? null,
    getUserId(req),
    req.prisma
  )
  return ApiResponse.success(
    res,
    new CategoryResponseDTO(category, { includeRelations: true }),
    'Categoría movida exitosamente'
  )
})

const toggleActive = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const category = await categoryService.toggleActive(
    empresaId,
    req.params.id as string,
    getUserId(req),
    req.prisma
  )
  const message = category.isActive
    ? 'Categoría activada exitosamente'
    : 'Categoría desactivada exitosamente'
  return ApiResponse.success(
    res,
    new CategoryResponseDTO(category, { includeRelations: true }),
    message
  )
})

// ---------------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------------

const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  await categoryService.delete(
    empresaId,
    req.params.id as string,
    getUserId(req),
    req.prisma
  )
  return ApiResponse.success(res, null, MSG.deleted)
})

const hardDelete = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  await categoryService.hardDelete(
    empresaId,
    req.params.id as string,
    getUserId(req),
    req.prisma
  )
  return ApiResponse.success(res, null, 'Categoría eliminada permanentemente')
})

export default {
  getAll,
  getTree,
  getRootCategories,
  getActive,
  search,
  getById,
  getSubTree,
  getChildren,
  getAncestors,
  getPath,
  getStats,
  create,
  bulkCreate,
  update,
  move,
  toggleActive,
  delete: deleteCategory,
  hardDelete,
}
