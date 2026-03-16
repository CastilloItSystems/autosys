// backend/src/features/inventory/movements/movements.controller.ts

import { Request, Response } from 'express'
import movementService from './movements.service.js'
import {
  CreateMovementDTO,
  UpdateMovementDTO,
  MovementResponseDTO,
} from './movements.dto.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { BadRequestError } from '../../../shared/utils/apiError.js'
import { INVENTORY_MESSAGES } from '../shared/constants/messages.js'
import { MovementType, IMovementFilters } from './movements.interface.js'

// ---------------------------------------------------------------------------
// Typed request helpers
// ---------------------------------------------------------------------------

/** Extracts empresaId injected by extractEmpresa middleware. Throws if missing. */
function getEmpresaId(req: Request): string {
  if (!req.empresaId) throw new Error('empresaId not set by middleware')
  return req.empresaId
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_SORT_FIELDS = new Set([
  'movementDate',
  'movementNumber',
  'type',
  'createdAt',
])

function parseSortBy(raw: unknown): string {
  const val = typeof raw === 'string' ? raw : 'movementDate'
  return VALID_SORT_FIELDS.has(val) ? val : 'movementDate'
}

function parseSortOrder(raw: unknown): 'asc' | 'desc' {
  return raw === 'asc' ? 'asc' : 'desc'
}

function parseLimit(raw: unknown, fallback: number): number {
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? Math.min(n, 500) : fallback
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

export class MovementController {
  /**
   * GET /api/inventory/movements
   */
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
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

    const filters: IMovementFilters = {}
    if (type && Object.values(MovementType).includes(type as MovementType))
      filters.type = type as MovementType
    if (itemId) filters.itemId = String(itemId)
    if (warehouseFromId) filters.warehouseFromId = String(warehouseFromId)
    if (warehouseToId) filters.warehouseToId = String(warehouseToId)
    if (createdBy) filters.createdBy = String(createdBy)
    if (reference) filters.reference = String(reference)
    if (dateFrom) filters.dateFrom = new Date(String(dateFrom))
    if (dateTo) filters.dateTo = new Date(String(dateTo))

    const result = await movementService.findAll(
      filters,
      Number(page) || 1,
      parseLimit(limit, 10),
      parseSortBy(sortBy),
      parseSortOrder(sortOrder),
      empresaId,
      req.prisma
    )

    const movements = result.items.map(
      (m) => new MovementResponseDTO(m, { includeRelations: true })
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
   * GET /api/inventory/movements/dashboard
   */
  getDashboard = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)

    const metrics = await movementService.getDashboardMetrics(
      empresaId,
      req.prisma
    )

    return ApiResponse.success(
      res,
      metrics,
      'Dashboard de movimientos obtenido'
    )
  })

  /**
   * GET /api/inventory/movements/type/:type
   */
  getByType = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { type } = req.params as { type: string }
    const { limit } = req.query

    if (!Object.values(MovementType).includes(type as MovementType)) {
      throw new BadRequestError(`Tipo de movimiento inválido: ${type}`)
    }

    const movements = await movementService.findByType(
      type as MovementType,
      empresaId,
      parseLimit(limit, 100),
      req.prisma
    )

    const response = movements.map(
      (m) => new MovementResponseDTO(m, { includeRelations: true })
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
   */
  getByWarehouse = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { warehouseId } = req.params as { warehouseId: string }
    const { limit } = req.query

    const movements = await movementService.findByWarehouse(
      warehouseId,
      empresaId,
      parseLimit(limit, 100),
      req.prisma
    )

    const response = movements.map(
      (m) => new MovementResponseDTO(m, { includeRelations: true })
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
   */
  getByItem = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { itemId } = req.params as { itemId: string }
    const { limit } = req.query

    const movements = await movementService.findByItem(
      itemId,
      empresaId,
      parseLimit(limit, 100),
      req.prisma
    )

    const response = movements.map(
      (m) => new MovementResponseDTO(m, { includeRelations: true })
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
   */
  getOne = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }

    const movement = await movementService.findById(id, empresaId, req.prisma)
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
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId
    const createDTO = new CreateMovementDTO(req.body)

    const movement = await movementService.create(
      createDTO,
      userId,
      empresaId,
      req.prisma
    )

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
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId
    const { id } = req.params as { id: string }
    const updateDTO = new UpdateMovementDTO(req.body)

    const movement = await movementService.update(
      id,
      updateDTO,
      userId,
      empresaId,
      req.prisma
    )

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
   * PATCH /api/inventory/movements/:id/cancel
   */
  cancel = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId
    const { id } = req.params as { id: string }

    const movement = await movementService.cancel(
      id,
      userId,
      empresaId,
      req.prisma
    )

    const response = new MovementResponseDTO(movement, {
      includeRelations: true,
    })

    return ApiResponse.success(
      res,
      response,
      INVENTORY_MESSAGES.movement.cancelled
    )
  })

  /**
   * DELETE /api/inventory/movements/:id
   * Siempre rechaza — los movimientos no se eliminan físicamente.
   * La ruta existe para devolver un error claro en vez de 404.
   */
  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const empresaId = getEmpresaId(req)

    // delegate to service which always throws BadRequestError
    await movementService.delete(id)

    // unreachable — service always throws, here just for TS return type
    return ApiResponse.success(res, {}, 'Movimiento eliminado')
  })
}

export default new MovementController()
