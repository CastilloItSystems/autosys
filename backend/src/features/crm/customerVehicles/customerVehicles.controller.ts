// backend/src/features/crm/customerVehicles/customerVehicles.controller.ts

import { Request, Response } from 'express'
import customerVehiclesService from './customerVehicles.service.js'
import { CreateCustomerVehicleDTO, UpdateCustomerVehicleDTO, CustomerVehicleResponseDTO } from './customerVehicles.dto.js'
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

class CustomerVehiclesController {
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { customerId } = req.params as { customerId: string }
    const { brand, isActive, search, page, limit, sortBy, sortOrder } = req.query

    const filters: Record<string, any> = {}
    if (brand) filters.brand = String(brand)
    if (isActive !== undefined) filters.isActive = isActive === 'true'
    if (search) filters.search = String(search)

    const pageNum = Number(page) || 1
    const limitNum = parseLimit(limit, 20)
    const sortByField = typeof sortBy === 'string' ? sortBy : 'brand'
    const sortOrderDir = sortOrder === 'desc' ? 'desc' : 'asc'

    const result = await customerVehiclesService.findAllByCustomer(
      customerId, filters, pageNum, limitNum, empresaId, req.prisma,
      sortByField, sortOrderDir as 'asc' | 'desc'
    )

    return ApiResponse.paginated(
      res,
      result.data.map((v) => new CustomerVehicleResponseDTO(v)),
      pageNum, limitNum, result.total,
      'Vehículos obtenidos exitosamente'
    )
  })

  getOne = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const vehicle = await customerVehiclesService.findById(id, empresaId, req.prisma)
    return ApiResponse.success(res, new CustomerVehicleResponseDTO(vehicle), 'Vehículo obtenido exitosamente')
  })

  create = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { customerId } = req.params as { customerId: string }
    const dto = new CreateCustomerVehicleDTO(req.body)
    const vehicle = await customerVehiclesService.create(dto, customerId, empresaId, req.prisma)
    return ApiResponse.created(res, new CustomerVehicleResponseDTO(vehicle), 'Vehículo creado exitosamente')
  })

  update = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const dto = new UpdateCustomerVehicleDTO(req.body)
    const vehicle = await customerVehiclesService.update(id, dto, empresaId, req.prisma)
    return ApiResponse.success(res, new CustomerVehicleResponseDTO(vehicle), 'Vehículo actualizado exitosamente')
  })

  delete = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const result = await customerVehiclesService.delete(id, empresaId, req.prisma)
    return ApiResponse.success(res, result, 'Vehículo eliminado exitosamente')
  })

  getServiceHistory = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const history = await customerVehiclesService.getServiceHistory(id, empresaId, req.prisma)
    return ApiResponse.success(res, history, 'Historial de servicios obtenido exitosamente')
  })
}

export default new CustomerVehiclesController()
