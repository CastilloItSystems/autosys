// backend/src/features/inventory/stock/stock.controller.ts

import { Request, Response } from 'express'
import stockService from './stock.service.js'
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
} from './stock.dto.js'
import {
  IStockFilters,
  IStockAlertFilters,
  IStockAlert,
  AlertType,
  AlertSeverity,
} from './stock.interface.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { INVENTORY_MESSAGES } from '../shared/constants/messages.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getEmpresaId(req: Request): string {
  if (!req.empresaId) throw new Error('empresaId not set by middleware')
  return req.empresaId
}

const VALID_STOCK_SORT = new Set([
  'createdAt',
  'updatedAt',
  'quantityAvailable',
  'quantityReal',
])

function parseSortBy(raw: unknown): string {
  const val = typeof raw === 'string' ? raw : 'createdAt'
  return VALID_STOCK_SORT.has(val) ? val : 'createdAt'
}

function parseLimit(raw: unknown, fallback: number): number {
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? Math.min(n, 500) : fallback
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

class StockController {
  /**
   * GET /api/inventory/stock
   */
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
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

    const filters: IStockFilters = {}
    if (itemId) filters.itemId = String(itemId)
    if (warehouseId) filters.warehouseId = String(warehouseId)
    if (lowStock === 'true') filters.lowStock = true
    if (outOfStock === 'true') filters.outOfStock = true
    if (minQuantity) filters.minQuantity = Number(minQuantity)
    if (maxQuantity) filters.maxQuantity = Number(maxQuantity)

    const result = await stockService.findAll(
      filters,
      Number(page) || 1,
      parseLimit(limit, 10),
      parseSortBy(sortBy),
      sortOrder === 'asc' ? 'asc' : 'desc',
      empresaId,
      req.prisma
    )

    const stocks = result.items.map(
      (stock) => new StockResponseDTO(stock, { includeRelations: true })
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
   */
  getOne = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }

    const stock = await stockService.findById(id, empresaId, req.prisma)

    return ApiResponse.success(
      res,
      new StockResponseDTO(stock, { includeRelations: true }),
      'Stock obtenido exitosamente'
    )
  })

  /**
   * GET /api/inventory/stock/item/:itemId
   */
  getByItem = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { itemId } = req.params as { itemId: string }

    const stocks = await stockService.findByItem(itemId, empresaId, req.prisma)
    const response = stocks.map(
      (s) => new StockResponseDTO(s, { includeRelations: true })
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
   */
  getByWarehouse = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { warehouseId } = req.params as { warehouseId: string }

    const stocks = await stockService.findByWarehouse(
      warehouseId,
      empresaId,
      req.prisma
    )
    const response = stocks.map(
      (s) => new StockResponseDTO(s, { includeRelations: true })
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
   */
  getLowStock = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const warehouseId = req.query.warehouseId
      ? String(req.query.warehouseId)
      : undefined

    const stocks = await stockService.findLowStock(
      empresaId,
      warehouseId,
      req.prisma
    )
    const response = stocks.map(
      (s) => new StockResponseDTO(s, { includeRelations: true })
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
   */
  getOutOfStock = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const warehouseId = req.query.warehouseId
      ? String(req.query.warehouseId)
      : undefined

    const stocks = await stockService.findOutOfStock(
      empresaId,
      warehouseId,
      req.prisma
    )
    const response = stocks.map(
      (s) => new StockResponseDTO(s, { includeRelations: true })
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
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const dto = new CreateStockDTO(req.body)

    const stock = await stockService.create(dto, empresaId, req.prisma)

    return ApiResponse.created(
      res,
      new StockResponseDTO(stock, { includeRelations: true }),
      'Stock creado exitosamente'
    )
  })

  /**
   * PUT /api/inventory/stock/:id
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const userId = req.user?.userId
    const dto = new UpdateStockDTO(req.body)

    const stock = await stockService.update(
      id,
      dto,
      empresaId,
      userId,
      req.prisma
    )

    return ApiResponse.success(
      res,
      new StockResponseDTO(stock, { includeRelations: true }),
      'Stock actualizado exitosamente'
    )
  })

  /**
   * POST /api/inventory/stock/adjust
   */
  adjust = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId
    const dto = new AdjustStockDTO(req.body)

    const stock = await stockService.adjust(dto, empresaId, userId, req.prisma)

    return ApiResponse.success(
      res,
      new StockResponseDTO(stock, { includeRelations: true }),
      INVENTORY_MESSAGES.stock.adjusted
    )
  })

  /**
   * POST /api/inventory/stock/reserve
   */
  reserve = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId
    const dto = new ReserveStockDTO(req.body)

    const stock = await stockService.reserve(dto, empresaId, userId, req.prisma)

    return ApiResponse.success(
      res,
      new StockResponseDTO(stock, { includeRelations: true }),
      INVENTORY_MESSAGES.stock.reserved
    )
  })

  /**
   * POST /api/inventory/stock/release
   */
  release = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId
    const dto = new ReleaseStockDTO(req.body)

    const stock = await stockService.releaseReservation(
      dto,
      empresaId,
      userId,
      req.prisma
    )

    return ApiResponse.success(
      res,
      new StockResponseDTO(stock, { includeRelations: true }),
      INVENTORY_MESSAGES.stock.released
    )
  })

  /**
   * POST /api/inventory/stock/transfer
   */
  transfer = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId
    const dto = new TransferStockDTO(req.body)

    const result = await stockService.transfer(
      dto,
      empresaId,
      userId,
      req.prisma
    )

    return ApiResponse.success(
      res,
      {
        from: new StockResponseDTO(result.from, { includeRelations: true }),
        to: new StockResponseDTO(result.to, { includeRelations: true }),
      },
      INVENTORY_MESSAGES.stock.transferred
    )
  })

  /**
   * GET /api/inventory/stock/alerts
   */
  getAlerts = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { page, limit, type, itemId, warehouseId, isRead, severity } =
      req.query

    const filters: IStockAlertFilters = {}
    if (type && Object.values(AlertType).includes(type as AlertType))
      filters.type = type as AlertType
    if (itemId) filters.itemId = String(itemId)
    if (warehouseId) filters.warehouseId = String(warehouseId)
    if (isRead !== undefined) filters.isRead = isRead === 'true'
    if (
      severity &&
      Object.values(AlertSeverity).includes(severity as AlertSeverity)
    )
      filters.severity = severity as AlertSeverity

    const result = await stockService.getAlerts(
      filters,
      empresaId,
      Number(page) || 1,
      parseLimit(limit, 20),
      req.prisma
    )

    const alerts = result.items.map(
      (alert) =>
        new StockAlertResponseDTO(
          alert as unknown as import('./stock.interface.js').IStockAlert
        )
    )

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
   */
  createAlert = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId
    const dto = new CreateStockAlertDTO(req.body)

    const alert = await stockService.createAlert(
      dto,
      empresaId,
      userId,
      req.prisma
    )

    return ApiResponse.created(
      res,
      new StockAlertResponseDTO(
        alert as unknown as import('./stock.interface.js').IStockAlert
      ),
      'Alerta creada exitosamente'
    )
  })

  /**
   * PATCH /api/inventory/stock/alerts/:id/read
   */
  markAlertAsRead = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId
    const { id } = req.params as { id: string }

    const alert = await stockService.markAlertAsRead(
      id,
      empresaId,
      userId,
      req.prisma
    )

    return ApiResponse.success(
      res,
      new StockAlertResponseDTO(
        alert as unknown as import('./stock.interface.js').IStockAlert
      ),
      'Alerta marcada como leída'
    )
  })
}

export default new StockController()
