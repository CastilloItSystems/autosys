// backend/src/features/sales/invoices/invoices.controller.ts

import { Request, Response } from 'express'
import invoicesService from './invoices.service.js'
import { InvoiceResponseDTO } from './invoices.dto.js'
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

class InvoicesController {
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { status, customerId, preInvoiceId, search, page, limit, sortBy, sortOrder } =
      req.query

    const filters: Record<string, any> = {}
    if (status) filters.status = status
    if (customerId) filters.customerId = String(customerId)
    if (preInvoiceId) filters.preInvoiceId = String(preInvoiceId)
    if (search) filters.search = String(search)

    const result = await invoicesService.findAll(
      filters,
      Number(page) || 1,
      parseLimit(limit, 20),
      empresaId,
      req.prisma,
      typeof sortBy === 'string' ? sortBy : 'createdAt',
      sortOrder === 'asc' ? 'asc' : 'desc'
    )

    const items = result.data.map(
      (i) => new InvoiceResponseDTO(i as unknown as Record<string, unknown>)
    )

    return ApiResponse.paginated(
      res,
      items,
      Number(page) || 1,
      parseLimit(limit, 20),
      result.total,
      'Facturas obtenidas exitosamente'
    )
  })

  getOne = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const invoice = await invoicesService.findById(
      id,
      empresaId,
      req.prisma
    )
    return ApiResponse.success(
      res,
      new InvoiceResponseDTO(invoice as unknown as Record<string, unknown>),
      'Factura obtenida exitosamente'
    )
  })

  cancel = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const userId = req.user?.userId ?? ''
    const { cancellationReason } = req.body

    const invoice = await invoicesService.cancel(
      id,
      empresaId,
      userId,
      cancellationReason,
      req.prisma
    )

    return ApiResponse.success(
      res,
      new InvoiceResponseDTO(invoice as unknown as Record<string, unknown>),
      'Factura anulada exitosamente'
    )
  })
}

export default new InvoicesController()
