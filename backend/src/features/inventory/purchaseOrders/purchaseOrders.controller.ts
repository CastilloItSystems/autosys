// backend/src/features/inventory/purchaseOrders/purchaseOrders.controller.ts

import { Request, Response } from 'express'
import PurchaseOrderService from './purchaseOrders.service'
import { CreatePurchaseOrderDTO } from './purchaseOrders.dto'
import { UpdatePurchaseOrderDTO } from './purchaseOrders.dto'
import { ApprovePurchaseOrderDTO } from './purchaseOrders.dto'
import { CreatePurchaseOrderItemDTO } from './purchaseOrders.dto'
import { PurchaseOrderResponseDTO } from './purchaseOrders.dto'
import { PurchaseOrderItemResponseDTO } from './purchaseOrders.dto'
import { ReceiveOrderDTO } from './purchaseOrders.dto'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware'
import { ApiResponse } from '../../../shared/utils/apiResponse'

class PurchaseOrderController {
  /**
   * GET /api/inventory/purchase-orders
   * Obtener todas las órdenes de compra con paginación
   */
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 20,
      status,
      supplierId,
      warehouseId,
      createdBy,
      orderFrom,
      orderTo,
      sortBy = 'orderDate',
      sortOrder = 'desc',
    } = req.query

    const filters: any = {}
    if (status) filters.status = status as string
    if (supplierId) filters.supplierId = supplierId as string
    if (warehouseId) filters.warehouseId = warehouseId as string
    if (createdBy) filters.createdBy = createdBy as string
    if (orderFrom) filters.orderFrom = new Date(orderFrom as string)
    if (orderTo) filters.orderTo = new Date(orderTo as string)

    const result = await PurchaseOrderService.findAll(
      filters,
      Number(page),
      Number(limit),
      sortBy as string,
      (sortOrder as string).toLowerCase() as 'asc' | 'desc',
      req.prisma || undefined
    )

    const items = result.items.map((po) => new PurchaseOrderResponseDTO(po))

    return res.json({
      success: true,
      data: items,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
    })
  })

  /**
   * GET /api/inventory/purchase-orders/:id
   * Obtener una orden de compra por ID
   */
  getOne = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { includeItems = true } = req.query

    const po = await PurchaseOrderService.findById(
      String(id),
      includeItems === 'true'
    )

    const dto = new PurchaseOrderResponseDTO(po)
    return res.json({ success: true, data: dto })
  })

  /**
   * POST /api/inventory/purchase-orders
   * Crear nueva orden de compra (con o sin items)
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id

    const dto = new CreatePurchaseOrderDTO(req.body)

    let result
    if (dto.items && dto.items.length > 0) {
      // Batch create con items
      result = await PurchaseOrderService.createWithItems(
        {
          supplierId: dto.supplierId,
          warehouseId: dto.warehouseId,
          notes: dto.notes,
          expectedDate: dto.expectedDate,
          createdBy: dto.createdBy,
          items: dto.items,
        },
        userId
      )
    } else {
      // Crear solo la PO
      result = await PurchaseOrderService.create(dto, userId)
    }

    const response = new PurchaseOrderResponseDTO(result)
    return res
      .status(201)
      .json({ success: true, message: 'Orden creada', data: response })
  })

  /**
   * PUT /api/inventory/purchase-orders/:id
   * Actualizar orden de compra
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const dto = new UpdatePurchaseOrderDTO(req.body)
    const result = await PurchaseOrderService.update(String(id), dto)

    const response = new PurchaseOrderResponseDTO(result)
    return res.json({ success: true, data: response })
  })

  /**
   * PATCH /api/inventory/purchase-orders/:id/approve
   * Aprobar orden de compra
   */
  approve = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const userId = (req as any).user?.id

    const dto = new ApprovePurchaseOrderDTO(req.body)
    const result = await PurchaseOrderService.approve(
      String(id),
      dto.approvedBy || userId
    )

    const response = new PurchaseOrderResponseDTO(result)
    return res.json({ success: true, data: response })
  })

  /**
   * PATCH /api/inventory/purchase-orders/:id/cancel
   * Cancelar orden de compra
   */
  cancel = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const result = await PurchaseOrderService.cancel(String(id))

    const response = new PurchaseOrderResponseDTO(result)
    return res.json({ success: true, data: response })
  })

  /**
   * POST /api/inventory/purchase-orders/:id/items
   * Agregar item a orden de compra
   */
  addItem = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const dto = new CreatePurchaseOrderItemDTO(req.body)
    const result = await PurchaseOrderService.addItem(String(id), dto)

    const response = new PurchaseOrderItemResponseDTO(result)
    return res
      .status(201)
      .json({ success: true, message: 'Item agregado', data: response })
  })

  /**
   * GET /api/inventory/purchase-orders/:id/items
   * Obtener items de una orden de compra
   */
  getItems = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const items = await PurchaseOrderService.getItems(String(id))

    const response = items.map((item) => new PurchaseOrderItemResponseDTO(item))
    return res.json({ success: true, data: response })
  })

  /**
   * POST /api/inventory/purchase-orders/:id/receive
   * Recepcionar mercancía de una orden de compra
   */
  receive = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const userId = (req as any).user?.id

    const dto = new ReceiveOrderDTO(req.body)
    const result = await PurchaseOrderService.receiveOrder(
      String(id),
      dto,
      userId
    )

    const response = new PurchaseOrderResponseDTO(result)
    return res
      .status(201)
      .json({ success: true, message: 'Recepción registrada', data: response })
  })

  /**
   * DELETE /api/inventory/purchase-orders/:id
   * Eliminar orden de compra
   */
  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const result = await PurchaseOrderService.delete(String(id))

    return res.json({ success: true, data: result })
  })
}

export { PurchaseOrderController }
