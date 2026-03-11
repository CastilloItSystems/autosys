/**
 * Internal Use Exit Type Controller
 * Handles inventory consumed for internal operations
 */

import { Request, Response } from 'express'
import { ExitNotesService } from '../exitNotes.service'
import { ApiResponse } from '../../../../shared/utils/apiResponse'
import { ExitNoteType } from '../exitNotes.interface'

const exitNotesService = ExitNotesService.getInstance()

/**
 * Create internal use exit note
 */
export const createInternalUseExit = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { warehouseId, items, department, reason, authorizedBy } = req.body
  const userId = (req as any).userId

  const exitNote = await exitNotesService.create(
    {
      type: ExitNoteType.INTERNAL_USE,
      warehouseId,
      items,
      recipientName: department,
      reason: reason || 'Internal consumption',
      reference: authorizedBy,
    },
    userId
  )

  res
    .status(201)
    .json(
      ApiResponse.created(
        exitNote,
        'Internal use exit note created successfully'
      )
    )
}

/**
 * Get internal use exit notes
 */
export const getInternalUseExits = async (
  req: Request,
  res: Response
): Promise<void> => {
  const page = parseInt((req.query.page as string) || '1')
  const limit = parseInt((req.query.limit as string) || '20')
  const { department } = req.query

  const result = await exitNotesService.findByType(
    ExitNoteType.INTERNAL_USE,
    page,
    limit
  )

  // Filter by department if provided
  const filtered =
    department && typeof department === 'string'
      ? result.data.filter((exit: any) => exit.recipientName === department)
      : result.data

  res
    .status(200)
    .json(
      ApiResponse.paginated(
        filtered,
        filtered.length,
        page,
        limit,
        'Internal use exits'
      )
    )
}

/**
 * Get internal use exit details
 */
export const getInternalUseExitDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { exitNoteId } = req.params

  const exitNote = await exitNotesService.findById(exitNoteId)
  if (!exitNote || exitNote.type !== ExitNoteType.INTERNAL_USE) {
    res.status(404).json(ApiResponse.error('Internal use exit note not found'))
    return
  }

  res
    .status(200)
    .json(
      ApiResponse.success(exitNote, 'Internal use exit note details retrieved')
    )
}

/**
 * Get internal use summary by department
 */
export const getInternalUseSummary = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { startDate, endDate } = req.query

  const result = await exitNotesService.findAll(
    {
      type: ExitNoteType.INTERNAL_USE,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    },
    1,
    1000 // Get all for summary
  )

  // Group by department
  const summary: Record<string, any> = {}
  result.data.forEach((exit: any) => {
    const dept = exit.recipientName || 'Unassigned'
    if (!summary[dept]) {
      summary[dept] = {
        department: dept,
        totalExits: 0,
        totalQuantity: 0,
        lastExit: null,
      }
    }
    summary[dept].totalExits++
    summary[dept].totalQuantity += exit.items.reduce(
      (sum: number, item: any) => sum + item.quantity,
      0
    )
    summary[dept].lastExit = exit.createdAt
  })

  res
    .status(200)
    .json(ApiResponse.success(summary, 'Internal use summary by department'))
}

/**
 * Approve internal use exit
 */
export const approveInternalUseExit = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { exitNoteId } = req.params
  const userId = (req as any).userId

  const exitNote = await exitNotesService.findById(exitNoteId)
  if (!exitNote) {
    res.status(404).json(ApiResponse.error('Exit note not found'))
    return
  }

  const updated = await exitNotesService.markAsReady(exitNoteId, userId)

  res
    .status(200)
    .json(
      ApiResponse.success(updated, 'Internal use exit approved successfully')
    )
}
