// backend/src/features/inventory/items/catalogs/model-compatibility/model-compatibility.controller.ts

import { Request, Response } from 'express'
import { asyncHandler } from '../../../../../shared/middleware/asyncHandler.middleware'
import { ApiResponse } from '../../../../../shared/utils/apiResponse'
import { modelCompatibilityService } from './model-compatibility.service'
import {
  CreateCompatibilityDTO,
  UpdateCompatibilityDTO,
  CompatibilityResponseDTO,
} from './model-compatibility.dto'
import { ICompatibilityFilters } from './model-compatibility.interface'

export class ModelCompatibilityController {
  /**
   * POST /api/inventory/catalogs/model-compatibility
   * Crear nueva compatibilidad
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const { partModelId, vehicleModelId, notes } = req.body
    const userId = req.user?.userId

    const dto = new CreateCompatibilityDTO({
      partModelId,
      vehicleModelId,
      notes,
    })

    const compatibility = await modelCompatibilityService.create(dto, userId)
    const response = new CompatibilityResponseDTO(compatibility)

    return ApiResponse.created(
      res,
      response,
      'Compatibilidad creada exitosamente'
    )
  })

  /**
   * GET /api/inventory/catalogs/model-compatibility
   * Obtener compatibilidades con filtros y paginación
   */
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const {
      partModelId,
      vehicleModelId,
      isVerified,
      page = 1,
      limit = 10,
    } = req.query

    const filters: ICompatibilityFilters = {}
    if (partModelId) filters.partModelId = partModelId as string
    if (vehicleModelId) filters.vehicleModelId = vehicleModelId as string
    if (isVerified !== undefined) filters.isVerified = isVerified === 'true'

    const result = await modelCompatibilityService.findAll(
      filters,
      Number(page),
      Number(limit)
    )
    const response = result.data.map((c) => new CompatibilityResponseDTO(c))

    return ApiResponse.paginated(
      res,
      response,
      Number(page),
      Number(limit),
      result.total,
      'Compatibilidades obtenidas exitosamente'
    )
  })

  /**
   * GET /api/inventory/catalogs/model-compatibility/:id
   * Obtener compatibilidad por ID
   */
  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }

    const compatibility = await modelCompatibilityService.findById(id)
    const response = new CompatibilityResponseDTO(compatibility)

    return ApiResponse.success(
      res,
      response,
      'Compatibilidad obtenida exitosamente'
    )
  })

  /**
   * GET /api/inventory/catalogs/model-compatibility/part/:partModelId
   * Obtener compatibilidades de un modelo de parte
   */
  getByPartModel = asyncHandler(async (req: Request, res: Response) => {
    const { partModelId } = req.params as { partModelId: string }

    const compatibilities =
      await modelCompatibilityService.findByPartModel(partModelId)
    const response = compatibilities.map((c) => new CompatibilityResponseDTO(c))

    return ApiResponse.success(
      res,
      response,
      'Compatibilidades del modelo de parte obtenidas exitosamente'
    )
  })

  /**
   * GET /api/inventory/catalogs/model-compatibility/vehicle/:vehicleModelId
   * Obtener compatibilidades de un modelo de vehículo
   */
  getByVehicleModel = asyncHandler(async (req: Request, res: Response) => {
    const { vehicleModelId } = req.params as { vehicleModelId: string }

    const compatibilities =
      await modelCompatibilityService.findByVehicleModel(vehicleModelId)
    const response = compatibilities.map((c) => new CompatibilityResponseDTO(c))

    return ApiResponse.success(
      res,
      response,
      'Compatibilidades del modelo de vehículo obtenidas exitosamente'
    )
  })

  /**
   * PUT /api/inventory/catalogs/model-compatibility/:id
   * Actualizar compatibilidad
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const { notes, isVerified } = req.body
    const userId = req.user?.userId

    const dto = new UpdateCompatibilityDTO({ notes, isVerified })
    const compatibility = await modelCompatibilityService.update(
      id,
      dto,
      userId
    )
    const response = new CompatibilityResponseDTO(compatibility)

    return ApiResponse.success(
      res,
      response,
      'Compatibilidad actualizada exitosamente'
    )
  })

  /**
   * PATCH /api/inventory/catalogs/model-compatibility/:id/verify
   * Marcar compatibilidad como verificada
   */
  verify = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const userId = req.user?.userId

    const compatibility = await modelCompatibilityService.verify(id, userId)
    const response = new CompatibilityResponseDTO(compatibility)

    return ApiResponse.success(
      res,
      response,
      'Compatibilidad marcada como verificada'
    )
  })

  /**
   * DELETE /api/inventory/catalogs/model-compatibility/:id
   * Eliminar compatibilidad
   */
  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const userId = req.user?.userId

    await modelCompatibilityService.delete(id, userId)

    return ApiResponse.success(
      res,
      null,
      'Compatibilidad eliminada exitosamente'
    )
  })
}
