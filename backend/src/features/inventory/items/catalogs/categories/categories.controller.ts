// backend/src/features/inventory/items/catalogs/categories/categories.controller.ts

import { Request, Response } from 'express'
import { CategoryService } from './categories.service'
import {
  CreateCategoryDTO,
  UpdateCategoryDTO,
  CategoryResponseDTO,
  CategoryTreeResponseDTO,
} from './categories.dto'
import { ApiResponse } from '../../../../../shared/utils/ApiResponse'
import { asyncHandler } from '../../../../../shared/middleware/asyncHandler.middleware'
import { INVENTORY_MESSAGES } from '../../../shared/constants/messages'

const categoryService = new CategoryService()

export class CategoryController {
  /**
   * GET /api/inventory/catalogs/categories
   * Obtener todas las categorías
   */
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, search, isActive, parentId, hasParent } = req.query

    const filters: any = {}
    if (search) filters.search = search as string
    if (isActive !== undefined) {
      filters.isActive =
        isActive === 'true' ? true : isActive === 'false' ? false : undefined
    }
    if (parentId) filters.parentId = parentId as string
    if (hasParent !== undefined) {
      filters.hasParent =
        hasParent === 'true' ? true : hasParent === 'false' ? false : undefined
    }

    const result = await categoryService.findAll(
      filters,
      Number(page) || 1,
      Number(limit) || 10
    )

    const categories = result.categories.map(
      (cat) => new CategoryResponseDTO(cat, { includeRelations: true })
    )

    return ApiResponse.paginated(
      res,
      categories,
      result.page,
      result.limit,
      result.total,
      'Categorías obtenidas exitosamente'
    )
  })

  /**
   * GET /api/inventory/catalogs/categories/tree
   * Obtener árbol completo de categorías
   */
  getTree = asyncHandler(async (req: Request, res: Response) => {
    const tree = await categoryService.getTree()
    const response = tree.map((cat) => new CategoryTreeResponseDTO(cat))

    return ApiResponse.success(
      res,
      response,
      'Árbol de categorías obtenido exitosamente'
    )
  })

  /**
   * GET /api/inventory/catalogs/categories/root
   * Obtener categorías raíz (sin padre)
   */
  getRootCategories = asyncHandler(async (req: Request, res: Response) => {
    const categories = await categoryService.getRootCategories()
    const response = categories.map(
      (cat) => new CategoryResponseDTO(cat, { includeRelations: true })
    )

    return ApiResponse.success(
      res,
      response,
      'Categorías raíz obtenidas exitosamente'
    )
  })

  /**
   * GET /api/inventory/catalogs/categories/active
   * Obtener categorías activas
   */
  getActive = asyncHandler(async (req: Request, res: Response) => {
    const categories = await categoryService.findActive()
    const response = categories.map(
      (cat) => new CategoryResponseDTO(cat, { includeRelations: false })
    )

    return ApiResponse.success(
      res,
      response,
      'Categorías activas obtenidas exitosamente'
    )
  })

  /**
   * GET /api/inventory/catalogs/categories/search
   * Buscar categorías
   */
  search = asyncHandler(async (req: Request, res: Response) => {
    const { term, limit } = req.query

    if (!term) {
      return ApiResponse.badRequest(res, 'El término de búsqueda es requerido')
    }

    const categories = await categoryService.search(
      term as string,
      Number(limit) || 10
    )
    const response = categories.map(
      (cat) => new CategoryResponseDTO(cat, { includeRelations: true })
    )

    return ApiResponse.success(res, response, 'Búsqueda completada')
  })

  /**
   * GET /api/inventory/catalogs/categories/:id
   * Obtener categoría por ID
   */
  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }

    const category = await categoryService.findById(id)
    const response = new CategoryResponseDTO(category, {
      includeRelations: true,
    })

    return ApiResponse.success(res, response, 'Categoría obtenida exitosamente')
  })

  /**
   * GET /api/inventory/catalogs/categories/:id/tree
   * Obtener subárbol de una categoría
   */
  getSubTree = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }

    const tree = await categoryService.getSubTree(id)
    const response = new CategoryTreeResponseDTO(tree)

    return ApiResponse.success(
      res,
      response,
      'Subárbol de categoría obtenido exitosamente'
    )
  })

  /**
   * GET /api/inventory/catalogs/categories/:id/children
   * Obtener hijos directos de una categoría
   */
  getChildren = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }

    const children = await categoryService.getChildren(id)
    const response = children.map(
      (cat) => new CategoryResponseDTO(cat, { includeRelations: false })
    )

    return ApiResponse.success(
      res,
      response,
      'Subcategorías obtenidas exitosamente'
    )
  })

  /**
   * GET /api/inventory/catalogs/categories/:id/ancestors
   * Obtener ancestros de una categoría
   */
  getAncestors = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }

    const ancestors = await categoryService.getAncestors(id)
    const response = ancestors.map(
      (cat) => new CategoryResponseDTO(cat, { includeRelations: false })
    )

    return ApiResponse.success(
      res,
      response,
      'Ancestros obtenidos exitosamente'
    )
  })

  /**
   * GET /api/inventory/catalogs/categories/:id/path
   * Obtener path completo de una categoría
   */
  getPath = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }

    const path = await categoryService.getPath(id)
    const response = path.map(
      (cat) => new CategoryResponseDTO(cat, { includeRelations: false })
    )

    return ApiResponse.success(
      res,
      response,
      'Path de categoría obtenido exitosamente'
    )
  })

  /**
   * GET /api/inventory/catalogs/categories/:id/stats
   * Obtener estadísticas de una categoría
   */
  getStats = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }

    const stats = await categoryService.getStats(id)

    return ApiResponse.success(
      res,
      stats,
      'Estadísticas obtenidas exitosamente'
    )
  })

  /**
   * POST /api/inventory/catalogs/categories
   * Crear nueva categoría
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const dto = new CreateCategoryDTO(req.body)
    const userId = req.user?.userId

    const category = await categoryService.create(dto, userId)
    const response = new CategoryResponseDTO(category, {
      includeRelations: true,
    })

    return ApiResponse.created(
      res,
      response,
      INVENTORY_MESSAGES.category.created
    )
  })

  /**
   * POST /api/inventory/catalogs/categories/bulk
   * Importación masiva de categorías
   */
  bulkCreate = asyncHandler(async (req: Request, res: Response) => {
    const { categories } = req.body
    const userId = req.user?.userId

    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return ApiResponse.badRequest(
        res,
        'Debe proporcionar un array de categorías'
      )
    }

    const dtos = categories.map((c) => new CreateCategoryDTO(c))
    const result = await categoryService.bulkCreate(dtos, userId)

    return ApiResponse.success(
      res,
      result,
      `Importación completada. Éxitos: ${result.success.length}, Errores: ${result.errors.length}`
    )
  })

  /**
   * PUT /api/inventory/catalogs/categories/:id
   * Actualizar categoría
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const dto = new UpdateCategoryDTO(req.body)
    const userId = req.user?.userId

    const category = await categoryService.update(id, dto, userId)
    const response = new CategoryResponseDTO(category, {
      includeRelations: true,
    })

    return ApiResponse.success(
      res,
      response,
      INVENTORY_MESSAGES.category.updated
    )
  })

  /**
   * PATCH /api/inventory/catalogs/categories/:id/move
   * Mover categoría a otro padre
   */
  move = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const { parentId } = req.body
    const userId = req.user?.userId

    const category = await categoryService.move(id, parentId || null, userId)
    const response = new CategoryResponseDTO(category, {
      includeRelations: true,
    })

    return ApiResponse.success(res, response, 'Categoría movida exitosamente')
  })

  /**
   * PATCH /api/inventory/catalogs/categories/:id/toggle
   * Activar/Desactivar categoría
   */
  toggleActive = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const userId = req.user?.userId

    const category = await categoryService.toggleActive(id, userId)
    const response = new CategoryResponseDTO(category, {
      includeRelations: true,
    })

    const message = category.isActive
      ? 'Categoría activada exitosamente'
      : 'Categoría desactivada exitosamente'

    return ApiResponse.success(res, response, message)
  })

  /**
   * DELETE /api/inventory/catalogs/categories/:id
   * Eliminar categoría (soft delete)
   */
  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const userId = req.user?.userId

    await categoryService.delete(id, userId)

    return ApiResponse.success(res, null, INVENTORY_MESSAGES.category.deleted)
  })

  /**
   * DELETE /api/inventory/catalogs/categories/:id/hard
   * Eliminar categoría permanentemente
   */
  hardDelete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const userId = req.user?.userId

    await categoryService.hardDelete(id, userId)

    return ApiResponse.success(res, null, 'Categoría eliminada permanentemente')
  })
}

export default new CategoryController()
