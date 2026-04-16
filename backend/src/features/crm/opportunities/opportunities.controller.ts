import { Request, Response } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import opportunitiesService from './opportunities.service.js'
import {
  CloseOpportunityDTO,
  CreateOpportunityDTO,
  OpportunityResponseDTO,
  UpdateOpportunityDTO,
  UpdateOpportunityStageDTO,
} from './opportunities.dto.js'

function getEmpresaId(req: Request): string {
  if (!req.empresaId) throw new Error('empresaId not set by middleware')
  return req.empresaId
}

function parseLimit(raw: unknown, fallback: number): number {
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? Math.min(n, 500) : fallback
}

class OpportunitiesController {
  getStageConfigs = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const channel = req.query.channel ? String(req.query.channel) : undefined
    const rows = await opportunitiesService.getStageConfigs(req.prisma, empresaId, channel)
    return ApiResponse.success(res, rows, 'Etapas configuradas obtenidas')
  })

  createStageConfig = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const row = await opportunitiesService.createStageConfig(req.prisma, empresaId, req.body)
    return ApiResponse.created(res, row, 'Etapa configurada creada')
  })

  getLossReasons = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const rows = await opportunitiesService.getLossReasons(req.prisma, empresaId)
    return ApiResponse.success(res, rows, 'Motivos de pérdida obtenidos')
  })

  createLossReason = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const row = await opportunitiesService.createLossReason(req.prisma, empresaId, req.body)
    return ApiResponse.created(res, row, 'Motivo de pérdida creado')
  })

  getAll = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const {
      channel,
      stageCode,
      status,
      ownerId,
      customerId,
      campaignId,
      search,
      amountMin,
      amountMax,
      expectedFrom,
      expectedTo,
      page,
      limit,
      sortBy,
      sortOrder,
    } = req.query

    const filters: Record<string, any> = {}
    if (channel) filters.channel = String(channel)
    if (stageCode) filters.stageCode = String(stageCode)
    if (status) filters.status = String(status)
    if (ownerId) filters.ownerId = String(ownerId)
    if (customerId) filters.customerId = String(customerId)
    if (campaignId) filters.campaignId = String(campaignId)
    if (search) filters.search = String(search)
    if (amountMin != null && String(amountMin) !== '') filters.amountMin = Number(amountMin)
    if (amountMax != null && String(amountMax) !== '') filters.amountMax = Number(amountMax)
    if (expectedFrom) filters.expectedFrom = String(expectedFrom)
    if (expectedTo) filters.expectedTo = String(expectedTo)

    const pageNum = Number(page) || 1
    const limitNum = parseLimit(limit, 20)
    const sortByField = typeof sortBy === 'string' ? sortBy : 'createdAt'
    const sortOrderDir = sortOrder === 'asc' ? 'asc' : 'desc'

    const result = await opportunitiesService.findAll(
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
      result.data.map((row) => new OpportunityResponseDTO(row)),
      pageNum,
      limitNum,
      result.total,
      'Oportunidades obtenidas exitosamente'
    )
  })

  getOne = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const row = await opportunitiesService.findById(req.prisma, empresaId, id)
    return ApiResponse.success(res, row, 'Oportunidad obtenida exitosamente')
  })

  create = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId
    if (!userId) throw new Error('user.id no disponible en request')

    const dto = new CreateOpportunityDTO(req.body)
    const row = await opportunitiesService.create(req.prisma, empresaId, userId, dto)
    return ApiResponse.created(res, new OpportunityResponseDTO(row), 'Oportunidad creada exitosamente')
  })

  update = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const dto = new UpdateOpportunityDTO(req.body)
    const row = await opportunitiesService.update(req.prisma, empresaId, id, dto)
    return ApiResponse.success(res, new OpportunityResponseDTO(row), 'Oportunidad actualizada exitosamente')
  })

  updateStage = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId
    if (!userId) throw new Error('user.id no disponible en request')

    const { id } = req.params as { id: string }
    const dto = new UpdateOpportunityStageDTO(req.body)
    const row = await opportunitiesService.updateStage(req.prisma, empresaId, id, userId, dto)
    return ApiResponse.success(res, new OpportunityResponseDTO(row), 'Etapa actualizada exitosamente')
  })

  close = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId
    if (!userId) throw new Error('user.id no disponible en request')

    const { id } = req.params as { id: string }
    const dto = new CloseOpportunityDTO(req.body)
    const row = await opportunitiesService.close(req.prisma, empresaId, id, userId, dto)
    return ApiResponse.success(res, new OpportunityResponseDTO(row), 'Oportunidad cerrada exitosamente')
  })
}

export default new OpportunitiesController()
