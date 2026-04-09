// backend/src/features/sales/preInvoices/preInvoices.controller.ts

import { Request, Response } from 'express'
import preInvoicesService from './preInvoices.service.js'
import { PreInvoiceResponseDTO } from './preInvoices.dto.js'
import { PreInvoiceStatus } from './preInvoices.interface.js'
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

class PreInvoicesController {
  /**
   * GET /api/sales/pre-invoices
   */
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const {
      status,
      customerId,
      orderId,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    } = req.query

    const filters: Record<string, any> = {}
    if (status) filters.status = status
    if (customerId) filters.customerId = String(customerId)
    if (orderId) filters.orderId = String(orderId)
    if (search) filters.search = String(search)

    const pageNum = Number(page) || 1
    const limitNum = parseLimit(limit, 20)
    const sortByField = typeof sortBy === 'string' ? sortBy : 'createdAt'
    const sortOrderDir = sortOrder === 'asc' ? 'asc' : 'desc'

    const result = await preInvoicesService.findAll(
      filters,
      pageNum,
      limitNum,
      empresaId,
      req.prisma,
      sortByField,
      sortOrderDir
    )

    const items = result.data.map(
      (pi) =>
        new PreInvoiceResponseDTO(pi as unknown as Record<string, unknown>)
    )

    return ApiResponse.paginated(
      res,
      items,
      pageNum,
      limitNum,
      result.total,
      'Pre-facturas obtenidas exitosamente'
    )
  })

  /**
   * GET /api/sales/pre-invoices/:id
   */
  getOne = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const pi = await preInvoicesService.findById(id, empresaId, req.prisma)
    return ApiResponse.success(
      res,
      new PreInvoiceResponseDTO(pi as unknown as Record<string, unknown>),
      'Pre-factura obtenida exitosamente'
    )
  })

  /**
   * PATCH /api/sales/pre-invoices/:id/start-preparation
   */
  startPreparation = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const userId = req.user?.userId ?? ''
    const pi = await preInvoicesService.startPreparation(
      id,
      empresaId,
      userId,
      req.prisma
    )
    return ApiResponse.success(
      res,
      new PreInvoiceResponseDTO(pi as unknown as Record<string, unknown>),
      'Preparación iniciada'
    )
  })

  /**
   * PATCH /api/sales/pre-invoices/:id/mark-ready
   */
  markReady = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const pi = await preInvoicesService.markReady(id, empresaId, req.prisma)
    return ApiResponse.success(
      res,
      new PreInvoiceResponseDTO(pi as unknown as Record<string, unknown>),
      'Pre-factura lista para pago'
    )
  })

  /**
   * PATCH /api/sales/pre-invoices/:id/mark-paid
   */
  markPaid = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const userId = req.user?.userId ?? ''
    const pi = await preInvoicesService.markPaid(
      id,
      empresaId,
      userId,
      req.prisma
    )
    return ApiResponse.success(
      res,
      new PreInvoiceResponseDTO(pi as unknown as Record<string, unknown>),
      'Pre-factura marcada como pagada'
    )
  })

  /**
   * PATCH /api/sales/pre-invoices/:id/cancel
   */
  cancel = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const pi = await preInvoicesService.cancel(id, empresaId, req.prisma)
    return ApiResponse.success(
      res,
      new PreInvoiceResponseDTO(pi as unknown as Record<string, unknown>),
      'Pre-factura cancelada'
    )
  })
}

export default new PreInvoicesController()
