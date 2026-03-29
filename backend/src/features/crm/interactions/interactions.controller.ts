// backend/src/features/crm/interactions/interactions.controller.ts

import { Request, Response } from 'express'
import interactionsService from './interactions.service.js'
import { CreateInteractionDTO, UpdateInteractionDTO, InteractionResponseDTO } from './interactions.dto.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'

function getEmpresaId(req: Request): string {
  if (!req.empresaId) throw new Error('empresaId not set by middleware')
  return req.empresaId
}

function getUserId(req: Request): string {
  if (!req.user?.userId) throw new Error('userId not set by middleware')
  return req.user.userId
}

function parseLimit(raw: unknown, fallback: number): number {
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? Math.min(n, 500) : fallback
}

class InteractionsController {
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const {
      customerId, leadId, type, channel, createdBy,
      dateFrom, dateTo, page, limit, sortBy, sortOrder,
    } = req.query

    const filters: Record<string, any> = {}
    if (customerId) filters.customerId = String(customerId)
    if (leadId) filters.leadId = String(leadId)
    if (type) filters.type = String(type)
    if (channel) filters.channel = String(channel)
    if (createdBy) filters.createdBy = String(createdBy)
    if (dateFrom) filters.dateFrom = String(dateFrom)
    if (dateTo) filters.dateTo = String(dateTo)

    const pageNum = Number(page) || 1
    const limitNum = parseLimit(limit, 20)
    const sortByField = typeof sortBy === 'string' ? sortBy : 'createdAt'
    const sortOrderDir = sortOrder === 'asc' ? 'asc' : 'desc'

    const result = await interactionsService.findAll(
      filters, pageNum, limitNum, empresaId, req.prisma,
      sortByField, sortOrderDir as 'asc' | 'desc'
    )

    return ApiResponse.paginated(
      res,
      result.data.map((i) => new InteractionResponseDTO(i)),
      pageNum, limitNum, result.total,
      'Interacciones obtenidas exitosamente'
    )
  })

  getOne = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const interaction = await interactionsService.findById(id, empresaId, req.prisma)
    return ApiResponse.success(res, new InteractionResponseDTO(interaction), 'Interacción obtenida exitosamente')
  })

  create = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = getUserId(req)
    const dto = new CreateInteractionDTO(req.body)
    const interaction = await interactionsService.create(dto, empresaId, userId, req.prisma)
    return ApiResponse.created(res, new InteractionResponseDTO(interaction), 'Interacción creada exitosamente')
  })

  update = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const dto = new UpdateInteractionDTO(req.body)
    const interaction = await interactionsService.update(id, dto, empresaId, req.prisma)
    return ApiResponse.success(res, new InteractionResponseDTO(interaction), 'Interacción actualizada exitosamente')
  })

  delete = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const result = await interactionsService.delete(id, empresaId, req.prisma)
    return ApiResponse.success(res, result, 'Interacción eliminada exitosamente')
  })
}

export default new InteractionsController()
