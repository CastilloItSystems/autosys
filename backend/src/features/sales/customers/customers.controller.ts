// backend/src/features/sales/customers/customers.controller.ts

import { Request, Response } from 'express'
import customersService from './customers.service.js'
import {
  CreateCustomerDTO,
  UpdateCustomerDTO,
  CustomerResponseDTO,
} from './customers.dto.js'
import { CustomerType } from './customers.interface.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getEmpresaId(req: Request): string {
  if (!req.empresaId) throw new Error('empresaId not set by middleware')
  return req.empresaId
}

function parseLimit(raw: unknown, fallback: number): number {
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? Math.min(n, 500) : fallback
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

class CustomersController {
  /**
   * GET /api/sales/customers
   */
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { type, isActive, search, page, limit, sortBy, sortOrder } = req.query

    const filters: Record<string, any> = {}
    if (type && Object.values(CustomerType).includes(type as CustomerType))
      filters.type = type
    if (isActive !== undefined) filters.isActive = isActive === 'true'
    if (search) filters.search = String(search)

    const pageNum = Number(page) || 1
    const limitNum = parseLimit(limit, 20)
    const sortByField = typeof sortBy === 'string' ? sortBy : 'name'
    const sortOrderDir = sortOrder === 'desc' ? 'desc' : 'asc'

    const result = await customersService.findAll(
      filters,
      pageNum,
      limitNum,
      empresaId,
      req.prisma,
      sortByField,
      sortOrderDir as 'asc' | 'desc'
    )

    const items = result.data.map((c) => new CustomerResponseDTO(c))

    return ApiResponse.paginated(
      res,
      items,
      pageNum,
      limitNum,
      result.total,
      'Clientes obtenidos exitosamente'
    )
  })

  /**
   * GET /api/sales/customers/:id
   */
  getOne = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }

    const customer = await customersService.findById(id, empresaId, req.prisma)

    return ApiResponse.success(
      res,
      new CustomerResponseDTO(customer),
      'Cliente obtenido exitosamente'
    )
  })

  /**
   * POST /api/sales/customers
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const dto = new CreateCustomerDTO(req.body)

    const customer = await customersService.create(dto, empresaId, req.prisma)

    return ApiResponse.created(
      res,
      new CustomerResponseDTO(customer),
      'Cliente creado exitosamente'
    )
  })

  /**
   * PUT /api/sales/customers/:id
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const dto = new UpdateCustomerDTO(req.body)

    const customer = await customersService.update(
      id,
      dto,
      empresaId,
      req.prisma
    )

    return ApiResponse.success(
      res,
      new CustomerResponseDTO(customer),
      'Cliente actualizado exitosamente'
    )
  })

  /**
   * DELETE /api/sales/customers/:id
   */
  delete = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }

    const result = await customersService.delete(id, empresaId, req.prisma)

    return ApiResponse.success(res, result, 'Cliente eliminado exitosamente')
  })
}

export default new CustomersController()
