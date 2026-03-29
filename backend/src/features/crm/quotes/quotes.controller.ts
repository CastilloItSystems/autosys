// backend/src/features/crm/quotes/quotes.controller.ts

import { Request, Response } from 'express'
import quotesService from './quotes.service.js'
import { CreateQuoteDTO, UpdateQuoteDTO, UpdateQuoteStatusDTO } from './quotes.dto.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { IQuoteFilters } from './quotes.interface.js'

function getEmpresaId(req: Request): string {
  if (!req.empresaId) throw new Error('empresaId not set by middleware')
  return req.empresaId
}

function getUserId(req: Request): string {
  if (!(req as any).user?.userId) throw new Error('userId not set by middleware')
  return (req as any).user.userId
}

class QuotesController {
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const {
      type, status, customerId, leadId, assignedTo,
      search, dateFrom, dateTo, page, limit, sortBy, sortOrder,
    } = req.query

    const filters: IQuoteFilters = {}
    if (type) filters.type = String(type)
    if (status) filters.status = String(status)
    if (customerId) filters.customerId = String(customerId)
    if (leadId) filters.leadId = String(leadId)
    if (assignedTo) filters.assignedTo = String(assignedTo)
    if (search) filters.search = String(search)
    if (dateFrom) filters.dateFrom = String(dateFrom)
    if (dateTo) filters.dateTo = String(dateTo)
    filters.page = Number(page) || 1
    filters.limit = Math.min(Number(limit) || 20, 500)
    if (sortBy) filters.sortBy = String(sortBy)
    if (sortOrder === 'asc' || sortOrder === 'desc') filters.sortOrder = sortOrder

    const result = await quotesService.findAll(req.prisma, empresaId, filters)

    return ApiResponse.paginated(
      res,
      result.data,
      filters.page!,
      filters.limit!,
      result.total,
      'Cotizaciones obtenidas exitosamente'
    )
  })

  getOne = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const quote = await quotesService.findById(req.prisma, id, empresaId)
    return ApiResponse.success(res, quote, 'Cotización obtenida exitosamente')
  })

  create = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = getUserId(req)
    const dto = new CreateQuoteDTO(req.body)
    const quote = await quotesService.create(req.prisma, empresaId, userId, dto)
    return ApiResponse.created(res, quote, 'Cotización creada exitosamente')
  })

  update = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const dto = new UpdateQuoteDTO(req.body)
    const quote = await quotesService.update(req.prisma, id, empresaId, dto)
    return ApiResponse.success(res, quote, 'Cotización actualizada exitosamente')
  })

  updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const dto = new UpdateQuoteStatusDTO(req.body)
    const quote = await quotesService.updateStatus(req.prisma, id, empresaId, dto)
    return ApiResponse.success(res, quote, 'Estado de cotización actualizado exitosamente')
  })

  revise = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = getUserId(req)
    const { id } = req.params as { id: string }
    const dto = new CreateQuoteDTO(req.body)
    const quote = await quotesService.revise(req.prisma, id, empresaId, userId, dto)
    return ApiResponse.created(res, quote, 'Nueva versión de cotización creada exitosamente')
  })

  remove = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const result = await quotesService.delete(req.prisma, id, empresaId)
    return ApiResponse.success(res, result, 'Cotización eliminada exitosamente')
  })
}

export default new QuotesController()
