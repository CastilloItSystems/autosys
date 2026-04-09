// backend/src/features/sales/orders/orders.controller.ts

import { Request, Response } from 'express'
import ordersService from './orders.service.js'
import {
  CreateOrderDTO,
  UpdateOrderDTO,
  OrderResponseDTO,
} from './orders.dto.js'
import { OrderStatus } from './orders.interface.js'
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

class OrdersController {
  /**
   * GET /api/sales/orders
   */
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const {
      status,
      customerId,
      warehouseId,
      startDate,
      endDate,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    } = req.query

    const filters: Record<string, any> = {}
    if (status && Object.values(OrderStatus).includes(status as OrderStatus))
      filters.status = status
    if (customerId) filters.customerId = String(customerId)
    if (warehouseId) filters.warehouseId = String(warehouseId)
    if (startDate) filters.startDate = new Date(String(startDate))
    if (endDate) filters.endDate = new Date(String(endDate))
    if (search) filters.search = String(search)

    const pageNum = Number(page) || 1
    const limitNum = parseLimit(limit, 20)
    const sortByField = typeof sortBy === 'string' ? sortBy : 'createdAt'
    const sortOrderDir = sortOrder === 'asc' ? 'asc' : 'desc'

    const result = await ordersService.findAll(
      filters,
      pageNum,
      limitNum,
      empresaId,
      req.prisma,
      sortByField,
      sortOrderDir as 'asc' | 'desc'
    )

    const items = result.data.map(
      (o) => new OrderResponseDTO(o as unknown as Record<string, unknown>)
    )

    return ApiResponse.paginated(
      res,
      items,
      pageNum,
      limitNum,
      result.total,
      'Órdenes obtenidas exitosamente'
    )
  })

  /**
   * GET /api/sales/orders/:id
   */
  getOne = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }

    const order = await ordersService.findById(id, empresaId, req.prisma)

    return ApiResponse.success(
      res,
      new OrderResponseDTO(order as unknown as Record<string, unknown>),
      'Orden obtenida exitosamente'
    )
  })

  /**
   * POST /api/sales/orders
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId
    const dto = new CreateOrderDTO(req.body)

    const order = await ordersService.createWithItems(
      dto,
      empresaId,
      userId,
      req.prisma
    )

    return ApiResponse.created(
      res,
      new OrderResponseDTO(order as unknown as Record<string, unknown>),
      'Orden creada exitosamente'
    )
  })

  /**
   * PUT /api/sales/orders/:id
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const dto = new UpdateOrderDTO(req.body)

    const order = await ordersService.update(id, dto, empresaId, req.prisma)

    return ApiResponse.success(
      res,
      new OrderResponseDTO(order as unknown as Record<string, unknown>),
      'Orden actualizada exitosamente'
    )
  })

  /**
   * PATCH /api/sales/orders/:id/approve
   */
  approve = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId ?? ''
    const { id } = req.params as { id: string }

    const order = await ordersService.approve(id, empresaId, userId, req.prisma)

    return ApiResponse.success(
      res,
      new OrderResponseDTO(order as unknown as Record<string, unknown>),
      'Orden aprobada exitosamente'
    )
  })

  /**
   * PATCH /api/sales/orders/:id/cancel
   */
  cancel = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }

    const order = await ordersService.cancel(id, empresaId, req.prisma)

    return ApiResponse.success(
      res,
      new OrderResponseDTO(order as unknown as Record<string, unknown>),
      'Orden cancelada exitosamente'
    )
  })

  /**
   * DELETE /api/sales/orders/:id
   */
  delete = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }

    const result = await ordersService.delete(id, empresaId, req.prisma)

    return ApiResponse.success(res, result, 'Orden eliminada exitosamente')
  })
}

export default new OrdersController()
