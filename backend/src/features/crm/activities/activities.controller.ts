// backend/src/features/crm/activities/activities.controller.ts

import { Request, Response } from 'express'
import activitiesService from './activities.service.js'
import {
  CreateActivityDTO,
  UpdateActivityDTO,
  CompleteActivityDTO,
  ActivityResponseDTO,
} from './activities.dto.js'
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

class ActivitiesController {
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const {
      customerId, leadId, assignedTo, status, type,
      dueBefore, dueAfter, page, limit, sortBy, sortOrder,
    } = req.query

    const filters: Record<string, any> = {}
    if (customerId) filters.customerId = String(customerId)
    if (leadId) filters.leadId = String(leadId)
    if (assignedTo) filters.assignedTo = String(assignedTo)
    if (status) filters.status = String(status)
    if (type) filters.type = String(type)
    if (dueBefore) filters.dueBefore = String(dueBefore)
    if (dueAfter) filters.dueAfter = String(dueAfter)

    const pageNum = Number(page) || 1
    const limitNum = parseLimit(limit, 20)
    const sortByField = typeof sortBy === 'string' ? sortBy : 'dueAt'
    const sortOrderDir = sortOrder === 'desc' ? 'desc' : 'asc'

    const result = await activitiesService.findAll(
      filters, pageNum, limitNum, empresaId, req.prisma,
      sortByField, sortOrderDir as 'asc' | 'desc'
    )

    return ApiResponse.paginated(
      res,
      result.data.map((a) => new ActivityResponseDTO(a)),
      pageNum, limitNum, result.total,
      'Actividades obtenidas exitosamente'
    )
  })

  getOne = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const activity = await activitiesService.findById(id, empresaId, req.prisma)
    return ApiResponse.success(res, new ActivityResponseDTO(activity), 'Actividad obtenida exitosamente')
  })

  create = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = getUserId(req)
    const dto = new CreateActivityDTO(req.body)
    const activity = await activitiesService.create(dto, empresaId, userId, req.prisma)
    return ApiResponse.created(res, new ActivityResponseDTO(activity), 'Actividad creada exitosamente')
  })

  update = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const dto = new UpdateActivityDTO(req.body)
    const activity = await activitiesService.update(id, dto, empresaId, req.prisma)
    return ApiResponse.success(res, new ActivityResponseDTO(activity), 'Actividad actualizada exitosamente')
  })

  complete = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = getUserId(req)
    const { id } = req.params as { id: string }
    const dto = new CompleteActivityDTO(req.body)
    const activity = await activitiesService.complete(
      id, dto.outcome, dto.completedAt, userId, empresaId, req.prisma
    )
    return ApiResponse.success(res, new ActivityResponseDTO(activity), 'Actividad completada exitosamente')
  })

  delete = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const result = await activitiesService.delete(id, empresaId, req.prisma)
    return ApiResponse.success(res, result, 'Actividad eliminada exitosamente')
  })
}

export default new ActivitiesController()
