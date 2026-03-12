// backend/src/features/inventory/exitNotes/items/items.controller.ts

import { Request, Response } from 'express'
import itemsService from './items.service.js'
import { ApiResponse } from '../../../../shared/utils/apiResponse.js'
import { asyncHandler } from '../../../../shared/middleware/asyncHandler.middleware.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getEmpresaId(req: Request): string {
  if (!req.empresaId) throw new Error('empresaId not set by middleware')
  return req.empresaId
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

class ExitNoteItemsController {
  /**
   * GET /api/inventory/exit-notes/:exitNoteId/items
   */
  getItems = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { exitNoteId } = req.params as { exitNoteId: string }

    const items = await itemsService.getItems(exitNoteId, empresaId, req.prisma)

    return ApiResponse.success(res, items, 'Items obtenidos exitosamente')
  })

  /**
   * GET /api/inventory/exit-notes/:exitNoteId/items/summary
   */
  getSummary = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { exitNoteId } = req.params as { exitNoteId: string }

    const summary = await itemsService.getSummary(
      exitNoteId,
      empresaId,
      req.prisma
    )

    return ApiResponse.success(res, summary, 'Resumen de items obtenido')
  })

  /**
   * GET /api/inventory/exit-notes/:exitNoteId/items/:itemId
   */
  getItem = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { itemId } = req.params as { itemId: string }

    const item = await itemsService.getItem(itemId, empresaId, req.prisma)

    return ApiResponse.success(res, item, 'Item obtenido exitosamente')
  })

  /**
   * PATCH /api/inventory/exit-notes/:exitNoteId/items/:itemId/pick
   */
  recordPicking = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId ?? ''
    const { itemId } = req.params as { itemId: string }
    const { location, notes } = req.body

    const item = await itemsService.recordPicking(
      itemId,
      String(location),
      empresaId,
      userId,
      notes !== undefined ? String(notes) : undefined,
      req.prisma
    )

    return ApiResponse.success(res, item, 'Picking registrado exitosamente')
  })

  /**
   * PATCH /api/inventory/exit-notes/:exitNoteId/items/:itemId/verify
   */
  verifyItem = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId ?? ''
    const { itemId } = req.params as { itemId: string }
    const { quantityVerified, notes } = req.body

    const item = await itemsService.verifyItem(
      itemId,
      Number(quantityVerified),
      empresaId,
      userId,
      notes !== undefined ? String(notes) : undefined,
      req.prisma
    )

    return ApiResponse.success(res, item, 'Item verificado exitosamente')
  })

  /**
   * PATCH /api/inventory/exit-notes/:exitNoteId/items/:itemId/reject
   */
  rejectItem = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId ?? ''
    const { itemId } = req.params as { itemId: string }
    const reason = String(req.body.reason ?? '')

    const item = await itemsService.rejectItem(
      itemId,
      reason,
      empresaId,
      userId,
      req.prisma
    )

    return ApiResponse.success(res, item, 'Item rechazado exitosamente')
  })

  /**
   * PATCH /api/inventory/exit-notes/:exitNoteId/items/:itemId/batch
   */
  assignBatch = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId ?? ''
    const { itemId } = req.params as { itemId: string }
    const { batchId } = req.body

    const item = await itemsService.assignBatch(
      itemId,
      String(batchId),
      empresaId,
      userId,
      req.prisma
    )

    return ApiResponse.success(res, item, 'Batch asignado exitosamente')
  })

  /**
   * PATCH /api/inventory/exit-notes/:exitNoteId/items/:itemId/serial
   */
  assignSerial = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId ?? ''
    const { itemId } = req.params as { itemId: string }
    const { serialNumberId } = req.body

    const item = await itemsService.assignSerialNumber(
      itemId,
      String(serialNumberId),
      empresaId,
      userId,
      req.prisma
    )

    return ApiResponse.success(
      res,
      item,
      'Número de serie asignado exitosamente'
    )
  })
}

export default new ExitNoteItemsController()
