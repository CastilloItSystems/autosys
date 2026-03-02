/**
 * Warranty Exit Type Controller
 * Handles warranty claims and replacements
 */

import { Request, Response } from 'express'
import { ExitNotesService } from '../exitNotes.service'
import { ApiResponse } from '../../../../shared/utils/api-response'
import { ExitNoteType } from '../exitNotes.interface'

const exitNotesService = ExitNotesService.getInstance()

/**
 * Create warranty exit note (for warranty claims)
 */
export const createWarrantyExit = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { warehouseId, items, recipientName, reason, reference } = req.body
  const userId = (req as any).userId

  const exitNote = await exitNotesService.create(
    {
      type: ExitNoteType.WARRANTY,
      warehouseId,
      items,
      recipientName,
      reason: reason || 'Warranty claim',
      reference, // warranty claim number
    },
    userId
  )

  res
    .status(201)
    .json(
      ApiResponse.created(exitNote, 'Warranty exit note created successfully')
    )
}

/**
 * Get warranty exit notes
 */
export const getWarrantyExits = async (
  req: Request,
  res: Response
): Promise<void> => {
  const page = parseInt((req.query.page as string) || '1')
  const limit = parseInt((req.query.limit as string) || '20')

  const result = await exitNotesService.findByType(
    ExitNoteType.WARRANTY,
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
        'Warranty exits'
      )
    )
}

/**
 * Get warranty exit details
 */
export const getWarrantyExitDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { exitNoteId } = req.params

  const exitNote = await exitNotesService.findById(exitNoteId)
  if (!exitNote) {
    res.status(404).json(ApiResponse.error('Warranty exit note not found'))
    return
  }

  res
    .status(200)
    .json(ApiResponse.success(exitNote, 'Warranty exit note details retrieved'))
}

/**
 * Process warranty replacement
 */
export const processWarrantyReplacement = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { exitNoteId } = req.params
  const { replacementItems } = req.body
  const userId = (req as any).userId

  // Transfer to ready for delivery
  const updated = await exitNotesService.markAsReady(exitNoteId, userId)

  res
    .status(200)
    .json(
      ApiResponse.success(
        updated,
        'Warranty replacement processed successfully'
      )
    )
}
