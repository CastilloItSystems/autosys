// backend/src/features/inventory/movements/movements.controller.ts

import { Request, Response } from 'express'
import { MovementService } from './movements.service'
import {
  CreateMovementDTO,
  UpdateMovementDTO,
  MovementResponseDTO,
} from './movements.dto'
import { ApiResponse } from '../../../shared/utils/ApiResponse'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware'
import { INVENTORY_MESSAGES } from '../shared/constants/messages'
import { MovementType } from './movements.interface'

const movementService = new MovementService()

export class MovementController {
  /**
   * GET /api/inventory/movements
   * Obtener todos los movimientos con filtros
   */
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const {
      page,
      limit,
      type,
      itemId,
      warehouseFromId,
      warehouseToId,
      createdBy,
      reference,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
    } = req.query

    const filters: any = {}
    if (type) filters.type = type as MovementType
    if (itemId) filters.itemId = itemId as string
    if (warehouseFromId) filters.warehouseFromId = warehouseFromId as string
    if (warehouseToId) filters.warehouseToId = warehouseToId as string
    if (createdBy) filters.createdBy = createdBy as string
    if (reference) filters.reference = reference as string
    if (dateFrom) filters.dateFrom = new Date(dateFrom as string)
    if (dateTo) filters.dateTo = new Date(dateTo as string)

    const result = await movementService.findAll(
      filters,
      Number(page) || 1,
      Number(limit) || 10,
      (sortBy as string) || 'movementDate',
      (sortOrder as 'asc' | 'desc') || 'desc',
      req.prisma || undefined
    )

    const movements = result.items.map(
      (movement: any) =>
        new MovementResponseDTO(movement, {
          includeRelations: true,
        })
    )

    return ApiResponse.paginated(
      res,
      movements,
      result.page,
      result.limit,
      result.total,
      'Movimientos obtenidos exitosamente'
    )
  })

  /**
   * GET /api/inventory/movements/type/:type
   * Obtener movimientos por tipo
   */
  getByType = asyncHandler(async (req: Request, res: Response) => {
    const { type } = req.params as { type: string }
    const { limit } = req.query

    const movements = await movementService.findByType(
      type as MovementType,
      Number(limit) || 100
    )
    const response = movements.map(
      (movement) =>
        new MovementResponseDTO(movement, {
          includeRelations: true,
        })
    )

    return ApiResponse.paginated(
      res,
      response,
      1,
      response.length,
      response.length,
      'Movimientos obtenidos exitosamente'
    )
  })

  /**
   * GET /api/inventory/movements/warehouse/:warehouseId
   * Obtener movimientos por almacén
   */
  getByWarehouse = asyncHandler(async (req: Request, res: Response) => {
    const { warehouseId } = req.params as { warehouseId: string }
    const { limit } = req.query

    const movements = await movementService.findByWarehouse(
      warehouseId,
      Number(limit) || 100
    )
    const response = movements.map(
      (movement) =>
        new MovementResponseDTO(movement, {
          includeRelations: true,
        })
    )

    return ApiResponse.paginated(
      res,
      response,
      1,
      response.length,
      response.length,
      'Movimientos obtenidos exitosamente'
    )
  })

  /**
   * GET /api/inventory/movements/item/:itemId
   * Obtener movimientos por artículo
   */
  getByItem = asyncHandler(async (req: Request, res: Response) => {
    const { itemId } = req.params as { itemId: string }
    const { limit } = req.query

    const movements = await movementService.findByItem(
      itemId,
      Number(limit) || 100
    )
    const response = movements.map(
      (movement) =>
        new MovementResponseDTO(movement, {
          includeRelations: true,
        })
    )

    return ApiResponse.paginated(
      res,
      response,
      1,
      response.length,
      response.length,
      'Movimientos obtenidos exitosamente'
    )
  })

  /**
   * GET /api/inventory/movements/:id
   * Obtener movimiento por ID
   */
  getOne = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }

    const movement = await movementService.findById(id)
    const response = new MovementResponseDTO(movement, {
      includeRelations: true,
    })

    return ApiResponse.success(
      res,
      response,
      'Movimiento obtenido exitosamente'
    )
  })

  /**
   * POST /api/inventory/movements
   * Crear un nuevo movimiento
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const createDTO = new CreateMovementDTO(req.body)
    const userId = req.user?.userId

    const movement = await movementService.create(createDTO, userId)
    const response = new MovementResponseDTO(movement, {
      includeRelations: true,
    })

    return ApiResponse.created(
      res,
      response,
      INVENTORY_MESSAGES.movement.created
    )
  })

  /**
   * PUT /api/inventory/movements/:id
   * Actualizar movimiento
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const updateDTO = new UpdateMovementDTO(req.body)
    const userId = req.user?.userId

    const movement = await movementService.update(id, updateDTO, userId)
    const response = new MovementResponseDTO(movement, {
      includeRelations: true,
    })

    return ApiResponse.success(
      res,
      response,
      'Movimiento actualizado exitosamente'
    )
  })

  /**
   * DELETE /api/inventory/movements/:id
   * Eliminar movimiento
   */
  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const userId = req.user?.userId

    await movementService.delete(id, userId)

    return ApiResponse.success(res, {}, 'Movimiento eliminado exitosamente')
  })

  /**
   * GET /api/inventory/movements/dashboard
   * Obtener métricas de dashboard
   */
  getDashboard = asyncHandler(async (_req: Request, res: Response) => {
    const metrics = await movementService.getDashboardMetrics()
    return ApiResponse.success(
      res,
      metrics,
      'Dashboard de movimientos obtenido'
    )
  })

  /**
   * PATCH /api/inventory/movements/:id/cancel
   * Cancelar movimiento
   */
  cancel = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const userId = req.user?.userId

    const movement = await movementService.cancel(id, userId)
    const response = new MovementResponseDTO(movement, {
      includeRelations: true,
    })

    return ApiResponse.success(
      res,
      response,
      INVENTORY_MESSAGES.movement.cancelled
    )
  })
}

export default new MovementController()
