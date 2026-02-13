// backend/src/features/inventory/items/catalogs/models/models.controller.ts

import { Request, Response } from 'express'
import { ModelService } from './models.service'
import {
  CreateModelDTO,
  UpdateModelDTO,
  ModelResponseDTO,
  ModelGroupedDTO,
} from './models.dto'
import { IModelFilters } from './models.interface'
import { ApiResponse } from '../../../../../shared/utils/ApiResponse'
import { asyncHandler } from '../../../../../shared/middleware/asyncHandler.middleware'
import { INVENTORY_MESSAGES } from '../../../shared/constants/messages'

const modelService = new ModelService()

export class ModelController {
  /**
   * GET /api/inventory/catalogs/models
   * Obtener todos los modelos
   */
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, search, brandId, year, isActive } = req.query

    const filters: IModelFilters = {}
    if (search) filters.search = search as string
    if (brandId) filters.brandId = brandId as string
    if (year) filters.year = Number(year)
    if (isActive === 'true') filters.isActive = true
    if (isActive === 'false') filters.isActive = false

    const result = await modelService.findAll(
      filters,
      Number(page) || 1,
      Number(limit) || 10
    )

    const models = result.models.map(
      (model) => new ModelResponseDTO(model, { includeBrand: true })
    )

    return ApiResponse.paginated(
      res,
      models,
      result.page,
      result.limit,
      result.total,
      'Modelos obtenidos exitosamente'
    )
  })

  /**
   * GET /api/inventory/catalogs/models/active
   * Obtener modelos activos
   */
  getActive = asyncHandler(async (req: Request, res: Response) => {
    const models = await modelService.findActive()
    const response = models.map(
      (model) => new ModelResponseDTO(model, { includeBrand: true })
    )

    return ApiResponse.success(
      res,
      response,
      'Modelos activos obtenidos exitosamente'
    )
  })

  /**
   * GET /api/inventory/catalogs/models/grouped
   * Obtener modelos agrupados por marca
   */
  getGroupedByBrand = asyncHandler(async (req: Request, res: Response) => {
    const grouped = await modelService.findGroupedByBrand()
    const response = grouped.map((group) => new ModelGroupedDTO(group))

    return ApiResponse.success(
      res,
      response,
      'Modelos agrupados obtenidos exitosamente'
    )
  })

  /**
   * GET /api/inventory/catalogs/models/years
   * Obtener años disponibles
   */
  getAvailableYears = asyncHandler(async (req: Request, res: Response) => {
    const years = await modelService.getAvailableYears()

    return ApiResponse.success(
      res,
      years,
      'Años disponibles obtenidos exitosamente'
    )
  })

  /**
   * GET /api/inventory/catalogs/models/search
   * Buscar modelos
   */
  search = asyncHandler(async (req: Request, res: Response) => {
    const { term, limit } = req.query

    if (!term) {
      return ApiResponse.badRequest(res, 'El término de búsqueda es requerido')
    }

    const models = await modelService.search(
      term as string,
      Number(limit) || 10
    )
    const response = models.map(
      (model) => new ModelResponseDTO(model, { includeBrand: true })
    )

    return ApiResponse.success(res, response, 'Búsqueda completada')
  })

  /**
   * GET /api/inventory/catalogs/models/brand/:brandId
   * Obtener modelos por marca
   */
  getByBrand = asyncHandler(async (req: Request, res: Response) => {
    const { brandId } = req.params as { brandId: string }

    const models = await modelService.findByBrand(brandId)
    const response = models.map(
      (model) => new ModelResponseDTO(model, { includeBrand: true })
    )

    return ApiResponse.success(
      res,
      response,
      'Modelos de la marca obtenidos exitosamente'
    )
  })

  /**
   * GET /api/inventory/catalogs/models/year/:year
   * Obtener modelos por año
   */
  getByYear = asyncHandler(async (req: Request, res: Response) => {
    const { year } = req.params as { year: string }

    const models = await modelService.findByYear(Number(year))
    const response = models.map(
      (model) => new ModelResponseDTO(model, { includeBrand: true })
    )

    return ApiResponse.success(
      res,
      response,
      `Modelos del año ${year} obtenidos exitosamente`
    )
  })

  /**
   * GET /api/inventory/catalogs/models/:id
   * Obtener modelo por ID
   */
  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }

    const model = await modelService.findById(id)
    const response = new ModelResponseDTO(model, { includeBrand: true })

    return ApiResponse.success(res, response, 'Modelo obtenido exitosamente')
  })

  /**
   * POST /api/inventory/catalogs/models
   * Crear nuevo modelo
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const dto = new CreateModelDTO(req.body)
    const userId = req.user?.userId

    const model = await modelService.create(dto, userId)
    const response = new ModelResponseDTO(model, { includeBrand: true })

    return ApiResponse.created(res, response, INVENTORY_MESSAGES.model.created)
  })

  /**
   * POST /api/inventory/catalogs/models/bulk
   * Importación masiva de modelos
   */
  bulkCreate = asyncHandler(async (req: Request, res: Response) => {
    const { models } = req.body
    const userId = req.user?.userId

    if (!models || !Array.isArray(models) || models.length === 0) {
      return ApiResponse.badRequest(
        res,
        'Debe proporcionar un array de modelos'
      )
    }

    const dtos = models.map((m) => new CreateModelDTO(m))
    const result = await modelService.bulkCreate(dtos, userId)

    return ApiResponse.success(
      res,
      result,
      `Importación completada. Éxitos: ${result.success.length}, Errores: ${result.errors.length}`
    )
  })

  /**
   * PUT /api/inventory/catalogs/models/:id
   * Actualizar modelo
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const dto = new UpdateModelDTO(req.body)
    const userId = req.user?.userId

    const model = await modelService.update(id, dto, userId)
    const response = new ModelResponseDTO(model, { includeBrand: true })

    return ApiResponse.success(res, response, INVENTORY_MESSAGES.model.updated)
  })

  /**
   * PATCH /api/inventory/catalogs/models/:id/toggle
   * Activar/Desactivar modelo
   */
  toggleActive = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const userId = req.user?.userId

    const model = await modelService.toggleActive(id, userId)
    const response = new ModelResponseDTO(model, { includeBrand: true })

    const message = model.isActive
      ? 'Modelo activado exitosamente'
      : 'Modelo desactivado exitosamente'

    return ApiResponse.success(res, response, message)
  })

  /**
   * DELETE /api/inventory/catalogs/models/:id
   * Eliminar modelo (soft delete)
   */
  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const userId = req.user?.userId

    await modelService.delete(id, userId)

    return ApiResponse.success(res, null, INVENTORY_MESSAGES.model.deleted)
  })

  /**
   * DELETE /api/inventory/catalogs/models/:id/hard
   * Eliminar modelo permanentemente
   */
  hardDelete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const userId = req.user?.userId

    await modelService.hardDelete(id, userId)

    return ApiResponse.success(res, null, 'Modelo eliminado permanentemente')
  })
}

export default new ModelController()
