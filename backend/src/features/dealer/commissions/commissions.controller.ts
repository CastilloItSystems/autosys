import { Request, Response } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { DealerCommissionResponseDTO, UpdateDealerCommissionDTO } from './commissions.dto.js'
import service from './commissions.service.js'

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

class DealerCommissionsController {
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { dealerQuoteId, sellerId, status, isActive, search, page, limit, sortBy, sortOrder } = req.query

    const filters: Record<string, unknown> = {}
    if (dealerQuoteId) filters.dealerQuoteId = String(dealerQuoteId)
    if (sellerId) filters.sellerId = String(sellerId)
    if (status) filters.status = String(status)
    if (isActive !== undefined) filters.isActive = isActive === 'true'
    if (search) filters.search = String(search)

    const pageNum = Number(page) || 1
    const limitNum = parseLimit(limit, 20)
    const sortByField = typeof sortBy === 'string' ? sortBy : 'createdAt'
    const sortOrderDir = sortOrder === 'asc' ? 'asc' : 'desc'

    const result = await service.findAll(filters, pageNum, limitNum, empresaId, req.prisma, sortByField, sortOrderDir)
    return ApiResponse.paginated(
      res,
      result.data.map((c) => new DealerCommissionResponseDTO(c)),
      pageNum,
      limitNum,
      result.total,
      'Comisiones obtenidas exitosamente'
    )
  })

  getOne = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const item = await service.findById(id, empresaId, req.prisma)
    return ApiResponse.success(res, new DealerCommissionResponseDTO(item), 'Comisión obtenida exitosamente')
  })

  update = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = getUserId(req)
    const { id } = req.params as { id: string }
    const dto = new UpdateDealerCommissionDTO(req.body)
    const updated = await service.update(id, dto, empresaId, userId, req.prisma)
    return ApiResponse.success(res, new DealerCommissionResponseDTO(updated), 'Comisión actualizada exitosamente')
  })
}

export default new DealerCommissionsController()
