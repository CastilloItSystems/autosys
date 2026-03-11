// backend/src/features/inventory/stock/stock.controller.ts

import { Request, Response } from 'express'
import { StockService } from './stock.service'
import {
  CreateStockDTO,
  UpdateStockDTO,
  StockResponseDTO,
  AdjustStockDTO,
  ReserveStockDTO,
  ReleaseStockDTO,
  TransferStockDTO,
  CreateStockAlertDTO,
  StockAlertResponseDTO,
} from './stock.dto'
import { ApiResponse } from '../../../shared/utils/apiResponse'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware'
import { INVENTORY_MESSAGES } from '../shared/constants/messages'

const stockService = new StockService()

export class StockController {
  /**
   * GET /api/inventory/stock
   * Obtener todos los stocks con filtros
   */
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const {
      page,
      limit,
      itemId,
      warehouseId,
      lowStock,
      outOfStock,
      minQuantity,
      maxQuantity,
      sortBy,
      sortOrder,
    } = req.query

    const filters: any = {}
    if (itemId) filters.itemId = itemId as string
    if (warehouseId) filters.warehouseId = warehouseId as string
    if (lowStock === 'true') filters.lowStock = true
    if (outOfStock === 'true') filters.outOfStock = true
    if (minQuantity) filters.minQuantity = Number(minQuantity)
    if (maxQuantity) filters.maxQuantity = Number(maxQuantity)

    const result = await stockService.findAll(
      filters,
      Number(page) || 1,
      Number(limit) || 10,
      (sortBy as string) || 'createdAt',
      (sortOrder as 'asc' | 'desc') || 'desc',
      req.prisma || undefined
    )

    const stocks = result.items.map(
      (stock) =>
        new StockResponseDTO(stock, {
          includeRelations: true,
        })
    )

    return ApiResponse.paginated(
      res,
      stocks,
      result.page,
      result.limit,
      result.total,
      'Stocks obtenidos exitosamente'
    )
  })

  /**
   * GET /api/inventory/stock/:id
   * Obtener stock por ID
   */
  getOne = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }

    const stock = await stockService.findById(id)
    const response = new StockResponseDTO(stock, {
      includeRelations: true,
    })

    return ApiResponse.success(res, response, 'Stock obtenido exitosamente')
  })

  /**
   * GET /api/inventory/stock/item/:itemId
   * Obtener stocks de un artículo
   */
  getByItem = asyncHandler(async (req: Request, res: Response) => {
    const { itemId } = req.params as { itemId: string }

    const stocks = await stockService.findByItem(itemId)
    const response = stocks.map(
      (stock) => new StockResponseDTO(stock, { includeRelations: true })
    )

    return ApiResponse.paginated(
      res,
      response,
      1,
      response.length,
      response.length,
      'Stocks obtenidos exitosamente'
    )
  })

  /**
   * GET /api/inventory/stock/warehouse/:warehouseId
   * Obtener stocks de un almacén
   */
  getByWarehouse = asyncHandler(async (req: Request, res: Response) => {
    const { warehouseId } = req.params as { warehouseId: string }

    const stocks = await stockService.findByWarehouse(warehouseId)
    const response = stocks.map(
      (stock) => new StockResponseDTO(stock, { includeRelations: true })
    )

    return ApiResponse.paginated(
      res,
      response,
      1,
      response.length,
      response.length,
      'Stocks obtenidos exitosamente'
    )
  })

  /**
   * GET /api/inventory/stock/low-stock
   * Obtener items con bajo stock
   */
  getLowStock = asyncHandler(async (req: Request, res: Response) => {
    const { warehouseId } = req.query

    const stocks = await stockService.findLowStock(warehouseId as string)
    const response = stocks.map(
      (stock) => new StockResponseDTO(stock, { includeRelations: true })
    )

    return ApiResponse.paginated(
      res,
      response,
      1,
      response.length,
      response.length,
      'Items con bajo stock obtenidos'
    )
  })

  /**
   * GET /api/inventory/stock/out-of-stock
   * Obtener items sin stock
   */
  getOutOfStock = asyncHandler(async (req: Request, res: Response) => {
    const { warehouseId } = req.query

    const stocks = await stockService.findOutOfStock(warehouseId as string)
    const response = stocks.map(
      (stock) => new StockResponseDTO(stock, { includeRelations: true })
    )

    return ApiResponse.paginated(
      res,
      response,
      1,
      response.length,
      response.length,
      'Items sin stock obtenidos'
    )
  })

  /**
   * POST /api/inventory/stock
   * Crear nuevo registro de stock
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const createDTO = new CreateStockDTO(req.body)

    const stock = await stockService.create(createDTO)
    const response = new StockResponseDTO(stock, {
      includeRelations: true,
    })

    return ApiResponse.created(res, response, 'Stock creado exitosamente')
  })

  /**
   * PUT /api/inventory/stock/:id
   * Actualizar stock
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const updateDTO = new UpdateStockDTO(req.body)
    const userId = req.user?.userId

    const stock = await stockService.update(id, updateDTO, userId)
    const response = new StockResponseDTO(stock, {
      includeRelations: true,
    })

    return ApiResponse.success(res, response, 'Stock actualizado exitosamente')
  })

  /**
   * POST /api/inventory/stock/adjust
   * Ajustar stock (entrada/salida)
   */
  adjust = asyncHandler(async (req: Request, res: Response) => {
    const adjustDTO = new AdjustStockDTO(req.body)
    const userId = req.user?.userId

    const stock = await stockService.adjust(adjustDTO, userId)
    const response = new StockResponseDTO(stock, {
      includeRelations: true,
    })

    return ApiResponse.success(res, response, INVENTORY_MESSAGES.stock.adjusted)
  })

  /**
   * POST /api/inventory/stock/reserve
   * Reservar stock
   */
  reserve = asyncHandler(async (req: Request, res: Response) => {
    const reserveDTO = new ReserveStockDTO(req.body)
    const userId = req.user?.userId

    const stock = await stockService.reserve(reserveDTO, userId)
    const response = new StockResponseDTO(stock, {
      includeRelations: true,
    })

    return ApiResponse.success(res, response, INVENTORY_MESSAGES.stock.reserved)
  })

  /**
   * POST /api/inventory/stock/release
   * Liberar reserva de stock
   */
  release = asyncHandler(async (req: Request, res: Response) => {
    const releaseDTO = new ReleaseStockDTO(req.body)
    const userId = req.user?.userId

    const stock = await stockService.releaseReservation(releaseDTO, userId)
    const response = new StockResponseDTO(stock, {
      includeRelations: true,
    })

    return ApiResponse.success(res, response, INVENTORY_MESSAGES.stock.released)
  })

  /**
   * POST /api/inventory/stock/transfer
   * Transferir stock entre almacenes
   */
  transfer = asyncHandler(async (req: Request, res: Response) => {
    const transferDTO = new TransferStockDTO(req.body)
    const userId = req.user?.userId

    const result = await stockService.transfer(transferDTO, userId)
    const response = {
      from: new StockResponseDTO(result.from, { includeRelations: true }),
      to: new StockResponseDTO(result.to, { includeRelations: true }),
    }

    return ApiResponse.success(
      res,
      response,
      INVENTORY_MESSAGES.stock.transferred
    )
  })

  /**
   * GET /api/inventory/stock/alerts
   * Obtener alertas de stock
   */
  getAlerts = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, type, itemId, warehouseId, isRead, severity } =
      req.query

    const filters: any = {}
    if (type) filters.type = type as string
    if (itemId) filters.itemId = itemId as string
    if (warehouseId) filters.warehouseId = warehouseId as string
    if (isRead !== undefined) filters.isRead = isRead === 'true'
    if (severity) filters.severity = severity as string

    const result = await stockService.getAlerts(
      filters,
      Number(page) || 1,
      Number(limit) || 20
    )

    const alerts = result.items.map((alert) => new StockAlertResponseDTO(alert))

    return ApiResponse.paginated(
      res,
      alerts,
      result.page,
      result.limit,
      result.total,
      'Alertas de stock obtenidas'
    )
  })

  /**
   * POST /api/inventory/stock/alerts
   * Crear alerta de stock
   */
  createAlert = asyncHandler(async (req: Request, res: Response) => {
    const alertDTO = new CreateStockAlertDTO(req.body)
    const userId = req.user?.userId

    const alert = await stockService.createAlert(alertDTO, userId)
    const response = new StockAlertResponseDTO(alert)

    return ApiResponse.created(res, response, 'Alerta creada exitosamente')
  })

  /**
   * PATCH /api/inventory/stock/alerts/:id/read
   * Marcar alerta como leída
   */
  markAlertAsRead = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const userId = req.user?.userId

    const alert = await stockService.markAlertAsRead(id, userId)
    const response = new StockAlertResponseDTO(alert)

    return ApiResponse.success(res, response, 'Alerta marcada como leída')
  })
}

export default new StockController()
