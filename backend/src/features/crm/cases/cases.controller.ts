// backend/src/features/crm/cases/cases.controller.ts

import { Request, Response } from 'express'
import casesService from './cases.service.js'
import { CreateCaseDTO, UpdateCaseDTO, UpdateCaseStatusDTO, AddCommentDTO } from './cases.dto.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { ICaseFilters } from './cases.interface.js'

function getEmpresaId(req: Request): string {
  if (!req.empresaId) throw new Error('empresaId not set by middleware')
  return req.empresaId
}

function getUserId(req: Request): string {
  if (!(req as any).user?.userId) throw new Error('userId not set by middleware')
  return (req as any).user.userId
}

class CasesController {
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const {
      type, priority, status, customerId, assignedTo,
      search, dateFrom, dateTo, page, limit, sortBy, sortOrder,
    } = req.query

    const filters: ICaseFilters = {}
    if (type) filters.type = String(type)
    if (priority) filters.priority = String(priority)
    if (status) filters.status = String(status)
    if (customerId) filters.customerId = String(customerId)
    if (assignedTo) filters.assignedTo = String(assignedTo)
    if (search) filters.search = String(search)
    if (dateFrom) filters.dateFrom = String(dateFrom)
    if (dateTo) filters.dateTo = String(dateTo)
    filters.page = Number(page) || 1
    filters.limit = Math.min(Number(limit) || 20, 500)
    if (sortBy) filters.sortBy = String(sortBy)
    if (sortOrder === 'asc' || sortOrder === 'desc') filters.sortOrder = sortOrder

    const result = await casesService.findAll(req.prisma, empresaId, filters)

    return ApiResponse.paginated(
      res,
      result.data,
      filters.page!,
      filters.limit!,
      result.total,
      'Casos obtenidos exitosamente'
    )
  })

  getOne = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const caseRecord = await casesService.findById(req.prisma, id, empresaId)
    return ApiResponse.success(res, caseRecord, 'Caso obtenido exitosamente')
  })

  create = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = getUserId(req)
    const dto = new CreateCaseDTO(req.body)
    const caseRecord = await casesService.create(req.prisma, empresaId, userId, dto)
    return ApiResponse.created(res, caseRecord, 'Caso creado exitosamente')
  })

  update = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const dto = new UpdateCaseDTO(req.body)
    const caseRecord = await casesService.update(req.prisma, id, empresaId, dto)
    return ApiResponse.success(res, caseRecord, 'Caso actualizado exitosamente')
  })

  updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const dto = new UpdateCaseStatusDTO(req.body)
    const caseRecord = await casesService.updateStatus(req.prisma, id, empresaId, dto)
    return ApiResponse.success(res, caseRecord, 'Estado del caso actualizado exitosamente')
  })

  addComment = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = getUserId(req)
    const { id } = req.params as { id: string }
    const dto = new AddCommentDTO(req.body)
    const comment = await casesService.addComment(req.prisma, id, empresaId, userId, dto)
    return ApiResponse.created(res, comment, 'Comentario agregado exitosamente')
  })

  remove = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const result = await casesService.delete(req.prisma, id, empresaId)
    return ApiResponse.success(res, result, 'Caso eliminado exitosamente')
  })
}

export default new CasesController()
