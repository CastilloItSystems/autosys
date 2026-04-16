import { Request, Response } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import campaignsService from './campaigns.service.js'
import { CampaignResponseDTO, CreateCampaignDTO } from './campaigns.dto.js'

function getEmpresaId(req: Request): string {
  if (!req.empresaId) throw new Error('empresaId not set by middleware')
  return req.empresaId
}

function parseLimit(raw: unknown, fallback: number): number {
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? Math.min(n, 500) : fallback
}

class CampaignsController {
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { status, channel, search, page, limit, sortBy, sortOrder } = req.query

    const filters: Record<string, any> = {}
    if (status) filters.status = String(status)
    if (channel) filters.channel = String(channel)
    if (search) filters.search = String(search)

    const pageNum = Number(page) || 1
    const limitNum = parseLimit(limit, 20)
    const sortByField = typeof sortBy === 'string' ? sortBy : 'createdAt'
    const sortOrderDir = sortOrder === 'asc' ? 'asc' : 'desc'

    const result = await campaignsService.findAll(
      req.prisma,
      empresaId,
      filters,
      pageNum,
      limitNum,
      sortByField,
      sortOrderDir as 'asc' | 'desc'
    )

    return ApiResponse.paginated(
      res,
      result.data.map((row) => new CampaignResponseDTO(row)),
      pageNum,
      limitNum,
      result.total,
      'Campañas obtenidas exitosamente'
    )
  })

  create = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId
    if (!userId) throw new Error('user.id no disponible en request')

    const dto = new CreateCampaignDTO(req.body)
    const row = await campaignsService.create(req.prisma, empresaId, userId, dto)
    return ApiResponse.created(res, new CampaignResponseDTO(row), 'Campaña creada exitosamente')
  })
}

export default new CampaignsController()
