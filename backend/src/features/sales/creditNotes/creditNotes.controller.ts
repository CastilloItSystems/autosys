// backend/src/features/sales/creditNotes/creditNotes.controller.ts

import { Request, Response } from 'express'
import creditNotesService from './creditNotes.service.js'
import { CreditNoteResponseDTO } from './creditNotes.dto.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { ICreditNoteFilters, CreditNoteStatus } from './creditNotes.interface.js'

function getEmpresaId(req: Request): string {
  if (!req.empresaId) throw new Error('empresaId not set by middleware')
  return req.empresaId
}

function parseLimit(raw: unknown, fallback: number): number {
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? Math.min(n, 500) : fallback
}

class CreditNotesController {
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { status, invoiceId, customerId, from, to, page, limit } = req.query

    const filters: ICreditNoteFilters = {}
    if (status) filters.status = String(status) as CreditNoteStatus
    if (invoiceId) filters.invoiceId = String(invoiceId)
    if (customerId) filters.customerId = String(customerId)
    if (from) filters.from = String(from)
    if (to) filters.to = String(to)

    const result = await creditNotesService.findAll(
      empresaId,
      filters,
      Number(page) || 1,
      parseLimit(limit, 20),
      req.prisma
    )

    const items = result.items.map((cn) => new CreditNoteResponseDTO(cn))

    return ApiResponse.paginated(
      res,
      items,
      Number(page) || 1,
      parseLimit(limit, 20),
      result.total,
      'Notas de crédito obtenidas exitosamente'
    )
  })

  getById = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }

    const cn = await creditNotesService.findById(id, empresaId, req.prisma)

    return ApiResponse.success(
      res,
      new CreditNoteResponseDTO(cn),
      'Nota de crédito obtenida exitosamente'
    )
  })

  create = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId ?? ''

    const cn = await creditNotesService.create(empresaId, req.body, userId, req.prisma)

    return ApiResponse.created(
      res,
      new CreditNoteResponseDTO(cn),
      'Nota de crédito creada exitosamente'
    )
  })

  cancel = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const userId = req.user?.userId ?? ''
    const { cancellationReason } = req.body

    const cn = await creditNotesService.cancel(id, empresaId, userId, cancellationReason, req.prisma)

    return ApiResponse.success(
      res,
      new CreditNoteResponseDTO(cn),
      'Nota de crédito anulada exitosamente'
    )
  })
}

export default new CreditNotesController()
