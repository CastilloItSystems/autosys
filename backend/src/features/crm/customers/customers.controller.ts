// backend/src/features/crm/customers/customers.controller.ts

import { Request, Response } from 'express'
import customersService from './customers.service.js'
import { CreateCustomerDTO, UpdateCustomerDTO, CustomerResponseDTO } from './customers.dto.js'
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

class CustomersController {
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { type, segment, preferredChannel, isActive, assignedSellerId, search, page, limit, sortBy, sortOrder } = req.query

    const filters: Record<string, any> = {}
    if (type) filters.type = type
    if (segment) filters.segment = segment
    if (preferredChannel) filters.preferredChannel = preferredChannel
    if (isActive !== undefined) filters.isActive = isActive === 'true'
    if (assignedSellerId) filters.assignedSellerId = String(assignedSellerId)
    if (search) filters.search = String(search)

    const pageNum = Number(page) || 1
    const limitNum = parseLimit(limit, 20)
    const sortByField = typeof sortBy === 'string' ? sortBy : 'name'
    const sortOrderDir = sortOrder === 'desc' ? 'desc' : 'asc'

    const result = await customersService.findAll(
      filters, pageNum, limitNum, empresaId, req.prisma,
      sortByField, sortOrderDir as 'asc' | 'desc'
    )

    return ApiResponse.paginated(
      res,
      result.data.map((c) => new CustomerResponseDTO(c)),
      pageNum, limitNum, result.total,
      'Clientes obtenidos exitosamente'
    )
  })

  getOne = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const customer = await customersService.findById(id, empresaId, req.prisma)
    return ApiResponse.success(res, new CustomerResponseDTO(customer), 'Cliente obtenido exitosamente')
  })

  getTimeline = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const timeline = await customersService.getTimeline(id, empresaId, req.prisma)
    return ApiResponse.success(res, timeline, 'Timeline del cliente obtenido exitosamente')
  })

  create = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const dto = new CreateCustomerDTO(req.body)
    const customer = await customersService.create(dto, empresaId, req.prisma)
    return ApiResponse.created(res, new CustomerResponseDTO(customer), 'Cliente creado exitosamente')
  })

  update = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const dto = new UpdateCustomerDTO(req.body)
    const customer = await customersService.update(id, dto, empresaId, req.prisma)
    return ApiResponse.success(res, new CustomerResponseDTO(customer), 'Cliente actualizado exitosamente')
  })

  delete = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const result = await customersService.delete(id, empresaId, req.prisma)
    return ApiResponse.success(res, result, 'Cliente eliminado exitosamente')
  })
}

export default new CustomersController()
