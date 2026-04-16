import { Request, Response } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { CreateDealerTradeInDTO, DealerTradeInResponseDTO, UpdateDealerTradeInDTO } from './tradeIns.dto.js'
import dealerTradeInsService from './tradeIns.service.js'

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

class DealerTradeInsController {
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { targetDealerUnitId, status, isActive, search, fromDate, toDate, page, limit, sortBy, sortOrder } = req.query

    const filters: Record<string, unknown> = {}
    if (targetDealerUnitId) filters.targetDealerUnitId = String(targetDealerUnitId)
    if (status) filters.status = String(status)
    if (isActive !== undefined) filters.isActive = isActive === 'true'
    if (search) filters.search = String(search)
    if (fromDate) filters.fromDate = new Date(String(fromDate))
    if (toDate) filters.toDate = new Date(String(toDate))

    const result = await dealerTradeInsService.findAll(
      filters,
      Number(page) || 1,
      parseLimit(limit, 20),
      empresaId,
      req.prisma,
      typeof sortBy === 'string' ? sortBy : 'createdAt',
      sortOrder === 'asc' ? 'asc' : 'desc'
    )

    return ApiResponse.paginated(
      res,
      result.data.map((r) => new DealerTradeInResponseDTO(r)),
      Number(page) || 1,
      parseLimit(limit, 20),
      result.total,
      'Retomas obtenidas exitosamente'
    )
  })

  getOne = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const item = await dealerTradeInsService.findById(id, getEmpresaId(req), req.prisma)
    return ApiResponse.success(res, new DealerTradeInResponseDTO(item), 'Retoma obtenida exitosamente')
  })

  create = asyncHandler(async (req: Request, res: Response) => {
    const dto = new CreateDealerTradeInDTO(req.body)
    const created = await dealerTradeInsService.create(dto, getEmpresaId(req), getUserId(req), req.prisma)
    return ApiResponse.created(res, new DealerTradeInResponseDTO(created), 'Retoma creada exitosamente')
  })

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const dto = new UpdateDealerTradeInDTO(req.body)
    const updated = await dealerTradeInsService.update(id, dto, getEmpresaId(req), getUserId(req), req.prisma)
    return ApiResponse.success(res, new DealerTradeInResponseDTO(updated), 'Retoma actualizada exitosamente')
  })

  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const result = await dealerTradeInsService.delete(id, getEmpresaId(req), getUserId(req), req.prisma)
    return ApiResponse.success(res, result, 'Retoma desactivada exitosamente')
  })
}

export default new DealerTradeInsController()
