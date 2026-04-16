import { Request, Response } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { CreateDealerDeliveryDTO, DealerDeliveryResponseDTO, UpdateDealerDeliveryDTO } from './deliveries.dto.js'
import service from './deliveries.service.js'

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

class DealerDeliveriesController {
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

    const result = await service.findAll(
      filters,
      Number(page) || 1,
      parseLimit(limit, 20),
      empresaId,
      req.prisma,
      typeof sortBy === 'string' ? sortBy : 'scheduledAt',
      sortOrder === 'asc' ? 'asc' : 'desc'
    )

    return ApiResponse.paginated(
      res,
      result.data.map((r) => new DealerDeliveryResponseDTO(r)),
      Number(page) || 1,
      parseLimit(limit, 20),
      result.total,
      'Entregas obtenidas exitosamente'
    )
  })

  getOne = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const item = await service.findById(id, getEmpresaId(req), req.prisma)
    return ApiResponse.success(res, new DealerDeliveryResponseDTO(item), 'Entrega obtenida exitosamente')
  })

  create = asyncHandler(async (req: Request, res: Response) => {
    const dto = new CreateDealerDeliveryDTO(req.body)
    const created = await service.create(dto, getEmpresaId(req), getUserId(req), req.prisma)
    return ApiResponse.created(res, new DealerDeliveryResponseDTO(created), 'Entrega creada exitosamente')
  })

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const dto = new UpdateDealerDeliveryDTO(req.body)
    const updated = await service.update(id, dto, getEmpresaId(req), getUserId(req), req.prisma)
    return ApiResponse.success(res, new DealerDeliveryResponseDTO(updated), 'Entrega actualizada exitosamente')
  })

  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const result = await service.delete(id, getEmpresaId(req), getUserId(req), req.prisma)
    return ApiResponse.success(res, result, 'Entrega desactivada exitosamente')
  })
}

export default new DealerDeliveriesController()
