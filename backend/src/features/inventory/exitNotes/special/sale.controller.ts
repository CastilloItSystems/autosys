/**
 * Sale Exit Type Controller
 * Handles exit notes for sales (requires PreInvoice linkage)
 */

import { Request, Response } from 'express'
import { ExitNotesService } from '../exitNotes.service'
import { ApiResponse } from '../../../../shared/utils/api-response'
import { ExitNoteType } from '../exitNotes.interface'

const exitNotesService = ExitNotesService.getInstance()

/**
 * Create sale exit note (linked to PreInvoice)
 */
export const createSaleExit = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { preInvoiceId, warehouseId, items, recipientName, recipientPhone } =
    req.body
  const userId = (req as any).userId

  const exitNote = await exitNotesService.create(
    {
      type: ExitNoteType.SALE,
      warehouseId,
      preInvoiceId,
      items,
      recipientName,
      recipientPhone,
    },
    userId
  )

  res
    .status(201)
    .json(ApiResponse.created(exitNote, 'Sale exit note created successfully'))
}

/**
 * Get sale exit notes
 */
export const getSaleExits = async (
  req: Request,
  res: Response
): Promise<void> => {
  const page = parseInt((req.query.page as string) || '1')
  const limit = parseInt((req.query.limit as string) || '20')

  const result = await exitNotesService.findByType(
    ExitNoteType.SALE,
    page,
    limit
  )

  res
    .status(200)
    .json(
      ApiResponse.paginated(
        result.data,
        result.total,
        page,
        limit,
        'Sale exits'
      )
    )
}

/**
 * Get sale exit note details
 */
export const getSaleExitDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { exitNoteId } = req.params

  const exitNote = await exitNotesService.findById(exitNoteId)
  if (!exitNote) {
    res.status(404).json(ApiResponse.error('Sale exit note not found'))
    return
  }

  res
    .status(200)
    .json(ApiResponse.success(exitNote, 'Sale exit note details retrieved'))
}
