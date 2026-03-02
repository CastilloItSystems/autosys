// backend/src/features/inventory/reservations/reservations.controller.ts

import { Request, Response } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware'
import { ApiResponse } from '../../../shared/utils/ApiResponse'
import ReservationService from './reservations.service'
import {
  CreateReservationDTO,
  UpdateReservationDTO,
  ReservationResponseDTO,
  ConsumeReservationDTO,
  ReleaseReservationDTO,
} from './reservations.dto.ts'
import {
  IReservationFilters,
  ReservationStatus,
} from './reservations.interface'

export class ReservationController {
  /**
   * GET /api/inventory/reservations
   * Obtener todas las reservas con paginación y filtros
   */
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 20,
      status,
      itemId,
      warehouseId,
      workOrderId,
      saleOrderId,
      createdBy,
      sortBy = 'reservedAt',
      sortOrder = 'desc',
    } = req.query

    const filters: IReservationFilters = {}
    if (status) filters.status = status as ReservationStatus
    if (itemId) filters.itemId = itemId as string
    if (warehouseId) filters.warehouseId = warehouseId as string
    if (workOrderId) filters.workOrderId = workOrderId as string
    if (saleOrderId) filters.saleOrderId = saleOrderId as string
    if (createdBy) filters.createdBy = createdBy as string

    const result = await ReservationService.findAll(
      filters,
      Number(page),
      Number(limit),
      sortBy as string,
      (sortOrder as string).toLowerCase() as 'asc' | 'desc',
      req.prisma || undefined
    )

    const items = result.items.map(
      (r) => new ReservationResponseDTO(r, { includeRelations: false })
    )

    return ApiResponse.paginated(
      res,
      items,
      Number(page),
      Number(limit),
      result.total
    )
  })

  /**
   * GET /api/inventory/reservations/:id
   * Obtener una reserva por ID
   */
  getOne = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const reservation = await ReservationService.findById(id)
    const dto = new ReservationResponseDTO(reservation, {
      includeRelations: true,
    })
    return ApiResponse.success(res, dto)
  })

  /**
   * GET /api/inventory/reservations/item/:itemId
   * Obtener reservas de un artículo
   */
  getByItem = asyncHandler(async (req: Request, res: Response) => {
    const { itemId } = req.params
    const { limit = 20 } = req.query
    const reservations = await ReservationService.findByItem(
      itemId,
      Number(limit)
    )
    const dtos = reservations.map(
      (r) => new ReservationResponseDTO(r, { includeRelations: false })
    )
    return ApiResponse.success(res, dtos)
  })

  /**
   * GET /api/inventory/reservations/warehouse/:warehouseId
   * Obtener reservas de un almacén
   */
  getByWarehouse = asyncHandler(async (req: Request, res: Response) => {
    const { warehouseId } = req.params
    const { limit = 20 } = req.query
    const reservations = await ReservationService.findByWarehouse(
      warehouseId,
      Number(limit)
    )
    const dtos = reservations.map(
      (r) => new ReservationResponseDTO(r, { includeRelations: false })
    )
    return ApiResponse.success(res, dtos)
  })

  /**
   * GET /api/inventory/reservations/active
   * Obtener reservas activas
   */
  getActive = asyncHandler(async (req: Request, res: Response) => {
    const { limit = 20 } = req.query
    const reservations = await ReservationService.findActive(Number(limit))
    const dtos = reservations.map(
      (r) => new ReservationResponseDTO(r, { includeRelations: false })
    )
    return ApiResponse.success(res, dtos)
  })

  /**
   * GET /api/inventory/reservations/expired
   * Obtener reservas expiradas
   */
  getExpired = asyncHandler(async (req: Request, res: Response) => {
    const { limit = 20 } = req.query
    const reservations = await ReservationService.findExpired(Number(limit))
    const dtos = reservations.map(
      (r) => new ReservationResponseDTO(r, { includeRelations: false })
    )
    return ApiResponse.success(res, dtos)
  })

  /**
   * POST /api/inventory/reservations
   * Crear nueva reserva
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const createDTO = new CreateReservationDTO(req.body)
    const reservation = await ReservationService.create(
      createDTO,
      (req.user as any)?.userId
    )
    const dto = new ReservationResponseDTO(reservation, {
      includeRelations: true,
    })
    return ApiResponse.created(res, dto)
  })

  /**
   * PUT /api/inventory/reservations/:id
   * Actualizar reserva
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const updateDTO = new UpdateReservationDTO(req.body)
    const reservation = await ReservationService.update(
      id,
      updateDTO,
      (req.user as any)?.userId
    )
    const dto = new ReservationResponseDTO(reservation, {
      includeRelations: true,
    })
    return ApiResponse.success(res, dto)
  })

  /**
   * POST /api/inventory/reservations/:id/consume
   * Consumir reserva (marcar como entregada)
   */
  consume = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const consumeDTO = new ConsumeReservationDTO({
      ...req.body,
      reservationId: id,
    })
    const reservation = await ReservationService.consume(
      consumeDTO.reservationId,
      consumeDTO.quantity,
      consumeDTO.deliveredBy,
      (req.user as any)?.userId
    )
    const dto = new ReservationResponseDTO(reservation, {
      includeRelations: true,
    })
    return ApiResponse.success(res, dto)
  })

  /**
   * POST /api/inventory/reservations/:id/release
   * Liberar reserva
   */
  release = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const releaseDTO = new ReleaseReservationDTO(req.body)
    const reservation = await ReservationService.release(
      id,
      releaseDTO.reason,
      (req.user as any)?.userId
    )
    const dto = new ReservationResponseDTO(reservation, {
      includeRelations: true,
    })
    return ApiResponse.success(res, dto)
  })

  /**
   * PATCH /api/inventory/reservations/:id/pending-pickup
   * Marcar como pendiente de entrega
   */
  markAsPendingPickup = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const reservation = await ReservationService.markAsPendingPickup(
      id,
      (req.user as any)?.userId
    )
    const dto = new ReservationResponseDTO(reservation, {
      includeRelations: true,
    })
    return ApiResponse.success(res, dto)
  })

  /**
   * DELETE /api/inventory/reservations/:id
   * Eliminar reserva
   */
  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const result = await ReservationService.delete(
      id,
      (req.user as any)?.userId
    )
    return ApiResponse.success(res, result)
  })
}
