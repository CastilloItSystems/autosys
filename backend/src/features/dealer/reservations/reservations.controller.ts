import { Request, Response } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import {
  CreateDealerReservationDTO,
  DealerReservationResponseDTO,
  UpdateDealerReservationDTO,
} from './reservations.dto.js'
import dealerReservationsService from './reservations.service.js'

function getEmpresaId(req: Request): string {
  if (!req.empresaId) throw new Error('empresaId not set by middleware')
  return req.empresaId
}

function getUserId(req: Request): string {
  const userId = req.user?.userId
  if (!userId) throw new Error('user not set by middleware')
  return userId
}

function parseLimit(raw: unknown, fallback: number): number {
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? Math.min(n, 500) : fallback
}

class DealerReservationsController {
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { dealerUnitId, status, isActive, search, fromDate, toDate, page, limit, sortBy, sortOrder } = req.query

    const filters: Record<string, unknown> = {}
    if (dealerUnitId) filters.dealerUnitId = String(dealerUnitId)
    if (status) filters.status = String(status)
    if (isActive !== undefined) filters.isActive = isActive === 'true'
    if (search) filters.search = String(search)
    if (fromDate) filters.fromDate = new Date(String(fromDate))
    if (toDate) filters.toDate = new Date(String(toDate))

    const pageNum = Number(page) || 1
    const limitNum = parseLimit(limit, 20)
    const sortByField = typeof sortBy === 'string' ? sortBy : 'reservedAt'
    const sortOrderDir = sortOrder === 'asc' ? 'asc' : 'desc'

    const result = await dealerReservationsService.findAll(
      filters,
      pageNum,
      limitNum,
      empresaId,
      req.prisma,
      sortByField,
      sortOrderDir
    )

    return ApiResponse.paginated(
      res,
      result.data.map((reservation) => new DealerReservationResponseDTO(reservation)),
      pageNum,
      limitNum,
      result.total,
      'Reservas obtenidas exitosamente'
    )
  })

  getOne = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const reservation = await dealerReservationsService.findById(id, empresaId, req.prisma)
    return ApiResponse.success(res, new DealerReservationResponseDTO(reservation), 'Reserva obtenida exitosamente')
  })

  create = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = getUserId(req)
    const dto = new CreateDealerReservationDTO(req.body)
    const created = await dealerReservationsService.create(dto, empresaId, userId, req.prisma)
    return ApiResponse.created(res, new DealerReservationResponseDTO(created), 'Reserva creada exitosamente')
  })

  update = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = getUserId(req)
    const { id } = req.params as { id: string }
    const dto = new UpdateDealerReservationDTO(req.body)
    const updated = await dealerReservationsService.update(id, dto, empresaId, userId, req.prisma)
    return ApiResponse.success(res, new DealerReservationResponseDTO(updated), 'Reserva actualizada exitosamente')
  })

  delete = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = getUserId(req)
    const { id } = req.params as { id: string }
    const result = await dealerReservationsService.delete(id, empresaId, userId, req.prisma)
    return ApiResponse.success(res, result, 'Reserva anulada exitosamente')
  })
}

export default new DealerReservationsController()
