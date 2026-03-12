// backend/src/features/inventory/reservations/reservations.controller.ts

import { Request, Response } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import reservationService from './reservations.service.js'
import {
  CreateReservationDTO,
  UpdateReservationDTO,
  ReservationResponseDTO,
  ConsumeReservationDTO,
  ReleaseReservationDTO,
} from './reservations.dto.js'
import {
  IReservationFilters,
  ReservationStatus,
} from './reservations.interface.js'
import { INVENTORY_MESSAGES } from '../shared/constants/messages.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extracts empresaId injected by extractEmpresa middleware. Throws if missing. */
function getEmpresaId(req: Request): string {
  if (!req.empresaId) throw new Error('empresaId not set by middleware')
  return req.empresaId
}

const VALID_SORT_FIELDS = new Set([
  'reservedAt',
  'expiresAt',
  'deliveredAt',
  'createdAt',
  'quantity',
  'status',
])

function parseSortBy(raw: unknown): string {
  const val = typeof raw === 'string' ? raw : 'reservedAt'
  return VALID_SORT_FIELDS.has(val) ? val : 'reservedAt'
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

export class ReservationController {
  /**
   * GET /api/inventory/reservations
   */
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const {
      page,
      limit,
      status,
      itemId,
      warehouseId,
      workOrderId,
      saleOrderId,
      createdBy,
      sortBy,
      sortOrder,
    } = req.query

    const filters: IReservationFilters = {}
    if (
      status &&
      Object.values(ReservationStatus).includes(status as ReservationStatus)
    )
      filters.status = status as ReservationStatus
    if (itemId) filters.itemId = String(itemId)
    if (warehouseId) filters.warehouseId = String(warehouseId)
    if (workOrderId) filters.workOrderId = String(workOrderId)
    if (saleOrderId) filters.saleOrderId = String(saleOrderId)
    if (createdBy) filters.createdBy = String(createdBy)

    const result = await reservationService.findAll(
      filters,
      Number(page) || 1,
      parseLimit(limit, 20),
      parseSortBy(sortBy),
      parseSortOrder(sortOrder),
      empresaId,
      req.prisma
    )

    const items = result.items.map(
      (r) => new ReservationResponseDTO(r, { includeRelations: false })
    )

    return ApiResponse.paginated(
      res,
      items,
      result.page,
      result.limit,
      result.total,
      'Reservas obtenidas exitosamente'
    )
  })

  /**
   * GET /api/inventory/reservations/active
   */
  getActive = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { limit } = req.query

    const reservations = await reservationService.findActive(
      empresaId,
      parseLimit(limit, 20),
      req.prisma
    )

    const dtos = reservations.map(
      (r) => new ReservationResponseDTO(r, { includeRelations: false })
    )

    return ApiResponse.success(res, dtos, 'Reservas activas obtenidas')
  })

  /**
   * GET /api/inventory/reservations/expired
   */
  getExpired = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { limit } = req.query

    const reservations = await reservationService.findExpired(
      empresaId,
      parseLimit(limit, 20),
      req.prisma
    )

    const dtos = reservations.map(
      (r) => new ReservationResponseDTO(r, { includeRelations: false })
    )

    return ApiResponse.success(res, dtos, 'Reservas expiradas obtenidas')
  })

  /**
   * GET /api/inventory/reservations/item/:itemId
   */
  getByItem = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { itemId } = req.params as { itemId: string }
    const { limit } = req.query

    const reservations = await reservationService.findByItem(
      itemId,
      empresaId,
      parseLimit(limit, 20),
      req.prisma
    )

    const dtos = reservations.map(
      (r) => new ReservationResponseDTO(r, { includeRelations: false })
    )

    return ApiResponse.success(res, dtos, 'Reservas del artículo obtenidas')
  })

  /**
   * GET /api/inventory/reservations/warehouse/:warehouseId
   */
  getByWarehouse = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { warehouseId } = req.params as { warehouseId: string }
    const { limit } = req.query

    const reservations = await reservationService.findByWarehouse(
      warehouseId,
      empresaId,
      parseLimit(limit, 20),
      req.prisma
    )

    const dtos = reservations.map(
      (r) => new ReservationResponseDTO(r, { includeRelations: false })
    )

    return ApiResponse.success(res, dtos, 'Reservas del almacén obtenidas')
  })

  /**
   * GET /api/inventory/reservations/:id
   */
  getOne = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }

    const reservation = await reservationService.findById(
      id,
      empresaId,
      req.prisma
    )
    const dto = new ReservationResponseDTO(reservation, {
      includeRelations: true,
    })

    return ApiResponse.success(res, dto, 'Reserva obtenida exitosamente')
  })

  /**
   * POST /api/inventory/reservations
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId
    const createDTO = new CreateReservationDTO(req.body)

    const reservation = await reservationService.create(
      createDTO,
      empresaId,
      userId,
      req.prisma
    )

    const dto = new ReservationResponseDTO(reservation, {
      includeRelations: true,
    })

    return ApiResponse.created(res, dto, INVENTORY_MESSAGES.reservation.created)
  })

  /**
   * PUT /api/inventory/reservations/:id
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId
    const { id } = req.params as { id: string }
    const updateDTO = new UpdateReservationDTO(req.body)

    const reservation = await reservationService.update(
      id,
      updateDTO,
      empresaId,
      userId,
      req.prisma
    )

    const dto = new ReservationResponseDTO(reservation, {
      includeRelations: true,
    })

    return ApiResponse.success(res, dto, 'Reserva actualizada exitosamente')
  })

  /**
   * POST /api/inventory/reservations/:id/consume
   */
  consume = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId
    const { id } = req.params as { id: string }
    const consumeDTO = new ConsumeReservationDTO({
      ...req.body,
      reservationId: id,
    })

    const reservation = await reservationService.consume(
      consumeDTO.reservationId,
      empresaId,
      consumeDTO.quantity,
      consumeDTO.deliveredBy,
      userId,
      req.prisma
    )

    const dto = new ReservationResponseDTO(reservation, {
      includeRelations: true,
    })

    return ApiResponse.success(
      res,
      dto,
      INVENTORY_MESSAGES.reservation.consumed
    )
  })

  /**
   * POST /api/inventory/reservations/:id/release
   */
  release = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId
    const { id } = req.params as { id: string }
    const releaseDTO = new ReleaseReservationDTO(req.body)

    const reservation = await reservationService.release(
      id,
      empresaId,
      releaseDTO.reason,
      userId,
      req.prisma
    )

    const dto = new ReservationResponseDTO(reservation, {
      includeRelations: true,
    })

    return ApiResponse.success(
      res,
      dto,
      INVENTORY_MESSAGES.reservation.released
    )
  })

  /**
   * PATCH /api/inventory/reservations/:id/pending-pickup
   */
  markAsPendingPickup = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId
    const { id } = req.params as { id: string }

    const reservation = await reservationService.markAsPendingPickup(
      id,
      empresaId,
      userId,
      req.prisma
    )

    const dto = new ReservationResponseDTO(reservation, {
      includeRelations: true,
    })

    return ApiResponse.success(
      res,
      dto,
      'Reserva marcada como pendiente de entrega'
    )
  })

  /**
   * DELETE /api/inventory/reservations/:id
   */
  delete = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId
    const { id } = req.params as { id: string }

    const result = await reservationService.delete(
      id,
      empresaId,
      userId,
      req.prisma
    )

    return ApiResponse.success(res, result, 'Reserva eliminada exitosamente')
  })
}

export default new ReservationController()
