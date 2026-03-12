// backend/src/features/inventory/purchaseOrders/purchaseOrders.controller.ts

import { Request, Response } from 'express'
import purchaseOrderService from './purchaseOrders.service.js'
import {
  CreatePurchaseOrderDTO,
  UpdatePurchaseOrderDTO,
  ApprovePurchaseOrderDTO,
  CreatePurchaseOrderItemDTO,
  PurchaseOrderResponseDTO,
  PurchaseOrderItemResponseDTO,
  ReceiveOrderDTO,
} from './purchaseOrders.dto.js'
import { IPurchaseOrderFilters, PurchaseOrderStatus } from './purchaseOrders.interface.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { INVENTORY_MESSAGES } from '../shared/constants/messages.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getEmpresaId(req: Request): string {
  if (!req.empresaId) throw new Error('empresaId not set by middleware')
  return req.empresaId
}

const VALID_SORT_FIELDS = new Set([
  'orderDate',
  'orderNumber',
  'status',
  'total',
  'createdAt',
])

function parseSortBy(raw: unknown): string {
  const val = typeof raw === 'string' ? raw : 'orderDate'
  return VALID_SORT_FIELDS.has(val) ? val : 'orderDate'
}

function parseSortOrder(raw: unknown): 'asc' | 'desc' {
  return raw === 'asc' ? 'asc' : 'desc'
}

function parseLimit(raw: unknown, fallback: number): number {
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? Math.min(n, 500) : fallback
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

class PurchaseOrderController {
  /**
   * GET /api/inventory/purchase-orders
   */
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const {
      page,
      limit,
      status,
      supplierId,
      warehouseId,
      createdBy,
      orderFrom,
      orderTo,
      sortBy,
      sortOrder,
    } = req.query

    const filters: IPurchaseOrderFilters = {}
    if (status && Object.values(PurchaseOrderStatus).includes(status as PurchaseOrderStatus))
      filters.status = status as PurchaseOrderStatus
    if (supplierId) filters.supplierId = String(supplierId)
    if (warehouseId) filters.warehouseId = String(warehouseId)
    if (createdBy) filters.createdBy = String(createdBy)
    if (orderFrom) filters.orderFrom = new Date(String(orderFrom))
    if (orderTo) filters.orderTo = new Date(String(orderTo))

    const result = await purchaseOrderService.findAll(
      filters,
      Number(page) || 1,
      parseLimit(limit, 20),
      parseSortBy(sortBy),
      parseSortOrder(sortOrder),
      empresaId,
      req.prisma
    )

    const items = result.items.map((po) => new PurchaseOrderResponseDTO(po))

    return ApiResponse.paginated(
      res,
      items,
      result.page,
      result.limit,
      result.total,
      'Órdenes de compra obtenidas exitosamente'
    )
  })

  /**
   * GET /api/inventory/purchase-orders/:id
   */
  getOne = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const includeItems = req.query.includeItems !== 'false'

    const po = await purchaseOrderService.findById(id, empresaId, includeItems, req.prisma)

    return ApiResponse.success(res, new PurchaseOrderResponseDTO(po), 'Orden de compra obtenida')
  })

  /**
   * POST /api/inventory/purchase-orders
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId
    const dto = new CreatePurchaseOrderDTO(req.body)

    let result
    if (dto.items && dto.items.length > 0) {
      result = await purchaseOrderService.createWithItems(
        {
          supplierId: dto.supplierId,
          warehouseId: dto.warehouseId,
          notes: dto.notes as any,
          expectedDate: dto.expectedDate as any,
          createdBy: dto.createdBy as any,
          items: dto.items as any,
        },
        empresaId,
        userId,
        req.prisma
      )
    } else {
      result = await purchaseOrderService.create(dto, empresaId, userId, req.prisma)
    }

    return ApiResponse.created(
      res,
      new PurchaseOrderResponseDTO(result),
      INVENTORY_MESSAGES.purchaseOrder.created
    )
  })

  /**
   * PUT /api/inventory/purchase-orders/:id
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const dto = new UpdatePurchaseOrderDTO(req.body)

    const result = await purchaseOrderService.update(id, dto, empresaId, req.prisma)

    return ApiResponse.success(
      res,
      new PurchaseOrderResponseDTO(result),
      INVENTORY_MESSAGES.purchaseOrder.updated
    )
  })

  /**
   * PATCH /api/inventory/purchase-orders/:id/approve
   */
  approve = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId
    const { id } = req.params as { id: string }
    const dto = new ApprovePurchaseOrderDTO(req.body)

    const result = await purchaseOrderService.approve(
      id,
      empresaId,
      dto.approvedBy ?? userId ?? '',
      req.prisma
    )

    return ApiResponse.success(
      res,
      new PurchaseOrderResponseDTO(result),
      INVENTORY_MESSAGES.purchaseOrder.sent
    )
  })

  /**
   * PATCH /api/inventory/purchase-orders/:id/cancel
   */
  cancel = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }

    const result = await purchaseOrderService.cancel(id, empresaId, req.prisma)

    return ApiResponse.success(
      res,
      new PurchaseOrderResponseDTO(result),
      INVENTORY_MESSAGES.purchaseOrder.cancelled
    )
  })

  /**
   * POST /api/inventory/purchase-orders/:id/items
   */
  addItem = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const dto = new CreatePurchaseOrderItemDTO(req.body)

    const result = await purchaseOrderService.addItem(id, dto, empresaId, req.prisma)

    return ApiResponse.created(
      res,
      new PurchaseOrderItemResponseDTO(result),
      'Item agregado a la orden de compra'
    )
  })

  /**
   * GET /api/inventory/purchase-orders/:id/items
   */
  getItems = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }

    const items = await purchaseOrderService.getItems(id, empresaId, req.prisma)

    return ApiResponse.success(
      res,
      items.map((item) => new PurchaseOrderItemResponseDTO(item)),
      'Items obtenidos exitosamente'
    )
  })

  /**
   * POST /api/inventory/purchase-orders/:id/receive
   */
  receive = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId
    const { id } = req.params as { id: string }
    const dto = new ReceiveOrderDTO(req.body)

    const result = await purchaseOrderService.receiveOrder(
      id,
      dto,
      empresaId,
      userId,
      req.prisma
    )

    return ApiResponse.created(
      res,
      new PurchaseOrderResponseDTO(result),
      INVENTORY_MESSAGES.purchaseOrder.received
    )
  })

  /**
   * DELETE /api/inventory/purchase-orders/:id
   */
  delete = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }

    const result = await purchaseOrderService.delete(id, empresaId, req.prisma)

    return ApiResponse.success(res, result, 'Orden de compra eliminada exitosamente')
  })
}

export default new PurchaseOrderController()