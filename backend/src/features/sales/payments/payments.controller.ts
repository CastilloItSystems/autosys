// backend/src/features/sales/payments/payments.controller.ts

import { Request, Response } from 'express'
import paymentsService from './payments.service.js'
import { CreatePaymentDTO, PaymentResponseDTO } from './payments.dto.js'
import { PaymentStatus, PaymentMethod } from './payments.interface.js'
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

class PaymentsController {
  /**
   * GET /api/sales/payments
   */
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const {
      status,
      method,
      customerId,
      preInvoiceId,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    } = req.query

    const filters: Record<string, any> = {}
    if (status) filters.status = status
    if (method) filters.method = method
    if (customerId) filters.customerId = String(customerId)
    if (preInvoiceId) filters.preInvoiceId = String(preInvoiceId)
    if (search) filters.search = String(search)

    const pageNum = Number(page) || 1
    const limitNum = parseLimit(limit, 20)
    const sortByField = typeof sortBy === 'string' ? sortBy : 'createdAt'
    const sortOrderDir = sortOrder === 'asc' ? 'asc' : 'desc'

    const result = await paymentsService.findAll(
      filters,
      pageNum,
      limitNum,
      empresaId,
      req.prisma,
      sortByField,
      sortOrderDir
    )

    const items = result.data.map(
      (p) => new PaymentResponseDTO(p as unknown as Record<string, unknown>)
    )

    return ApiResponse.paginated(
      res,
      items,
      pageNum,
      limitNum,
      result.total,
      'Pagos obtenidos exitosamente'
    )
  })

  /**
   * GET /api/sales/payments/:id
   */
  getOne = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const payment = await paymentsService.findById(id, empresaId, req.prisma)
    return ApiResponse.success(
      res,
      new PaymentResponseDTO(payment as unknown as Record<string, unknown>),
      'Pago obtenido exitosamente'
    )
  })

  /**
   * POST /api/sales/payments
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId
    const dto = new CreatePaymentDTO(req.body)

    const payment = await paymentsService.create(
      dto,
      empresaId,
      userId,
      req.prisma
    )

    return ApiResponse.created(
      res,
      new PaymentResponseDTO(payment as unknown as Record<string, unknown>),
      'Pago procesado exitosamente'
    )
  })

  /**
   * PATCH /api/sales/payments/:id/cancel
   */
  cancel = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const payment = await paymentsService.cancel(id, empresaId, req.prisma)
    return ApiResponse.success(
      res,
      new PaymentResponseDTO(payment as unknown as Record<string, unknown>),
      'Pago cancelado exitosamente'
    )
  })
}

export default new PaymentsController()
