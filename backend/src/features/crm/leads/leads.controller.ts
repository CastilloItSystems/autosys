// backend/src/features/crm/leads/leads.controller.ts

import { Request, Response } from 'express'
import leadsService from './leads.service.js'
import { CreateLeadDTO, UpdateLeadDTO, UpdateLeadStatusDTO, LeadResponseDTO } from './leads.dto.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'

function getEmpresaId(req: Request): string {
  if (!req.empresaId) throw new Error('empresaId not set by middleware')
  return req.empresaId
}

function parseLimit(raw: unknown, fallback: number): number {
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? Math.min(n, 500) : fallback
}

class LeadsController {
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const {
      channel, status, assignedTo, customerId, search,
      dateFrom, dateTo, page, limit, sortBy, sortOrder,
    } = req.query

    const filters: Record<string, any> = {}
    if (channel) filters.channel = String(channel)
    if (status) filters.status = String(status)
    if (assignedTo) filters.assignedTo = String(assignedTo)
    if (customerId) filters.customerId = String(customerId)
    if (search) filters.search = String(search)
    if (dateFrom) filters.dateFrom = String(dateFrom)
    if (dateTo) filters.dateTo = String(dateTo)

    const pageNum = Number(page) || 1
    const limitNum = parseLimit(limit, 20)
    const sortByField = typeof sortBy === 'string' ? sortBy : 'createdAt'
    const sortOrderDir = sortOrder === 'asc' ? 'asc' : 'desc'

    const result = await leadsService.findAll(
      filters, pageNum, limitNum, empresaId, req.prisma,
      sortByField, sortOrderDir as 'asc' | 'desc'
    )

    return ApiResponse.paginated(
      res,
      result.data.map((l) => new LeadResponseDTO(l)),
      pageNum, limitNum, result.total,
      'Leads obtenidos exitosamente'
    )
  })

  getOne = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const lead = await leadsService.findById(id, empresaId, req.prisma)
    return ApiResponse.success(res, new LeadResponseDTO(lead), 'Lead obtenido exitosamente')
  })

  create = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const dto = new CreateLeadDTO(req.body)
    const lead = await leadsService.create(dto, empresaId, req.prisma)
    return ApiResponse.created(res, new LeadResponseDTO(lead), 'Lead creado exitosamente')
  })

  update = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const dto = new UpdateLeadDTO(req.body)
    const lead = await leadsService.update(id, dto, empresaId, req.prisma)
    return ApiResponse.success(res, new LeadResponseDTO(lead), 'Lead actualizado exitosamente')
  })

  updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const dto = new UpdateLeadStatusDTO(req.body)
    const lead = await leadsService.updateStatus(
      id, dto.status, dto.lostReason, dto.closedAt, empresaId, req.prisma
    )
    return ApiResponse.success(res, new LeadResponseDTO(lead), 'Estado del lead actualizado exitosamente')
  })

  delete = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const result = await leadsService.delete(id, empresaId, req.prisma)
    return ApiResponse.success(res, result, 'Lead eliminado exitosamente')
  })
}

export default new LeadsController()
