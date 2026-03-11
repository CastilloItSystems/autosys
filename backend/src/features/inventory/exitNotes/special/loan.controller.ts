/**
 * Loan Exit Type Controller
 * Handles temporary equipment loans with expected return
 */

import { Request, Response } from 'express'
import { ExitNotesService } from '../exitNotes.service'
import { ApiResponse } from '../../../../shared/utils/apiResponse'
import { ExitNoteType } from '../exitNotes.interface'

const exitNotesService = ExitNotesService.getInstance()

/**
 * Create loan exit note
 */
export const createLoanExit = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { warehouseId, items, recipientName, recipientId, expectedReturnDate } =
    req.body
  const userId = (req as any).userId

  const exitNote = await exitNotesService.create(
    {
      type: ExitNoteType.LOAN,
      warehouseId,
      items,
      recipientName,
      recipientId,
      expectedReturnDate: expectedReturnDate
        ? new Date(expectedReturnDate)
        : undefined,
      reason: 'Equipment loan',
    },
    userId
  )

  res
    .status(201)
    .json(ApiResponse.created(exitNote, 'Loan exit note created successfully'))
}

/**
 * Get loan exit notes
 */
export const getLoanExits = async (
  req: Request,
  res: Response
): Promise<void> => {
  const page = parseInt((req.query.page as string) || '1')
  const limit = parseInt((req.query.limit as string) || '20')

  const result = await exitNotesService.findByType(
    ExitNoteType.LOAN,
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
        'Loan exits'
      )
    )
}

/**
 * Get loan exit details
 */
export const getLoanExitDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { exitNoteId } = req.params

  const exitNote = await exitNotesService.findById(exitNoteId)
  if (!exitNote) {
    res.status(404).json(ApiResponse.error('Loan exit note not found'))
    return
  }

  res
    .status(200)
    .json(ApiResponse.success(exitNote, 'Loan exit note details retrieved'))
}

/**
 * Get active loans (not yet returned)
 */
export const getActiveLoans = async (
  req: Request,
  res: Response
): Promise<void> => {
  const page = parseInt((req.query.page as string) || '1')
  const limit = parseInt((req.query.limit as string) || '20')

  const result = await exitNotesService.findAll(
    {
      type: ExitNoteType.LOAN,
      status: 'DELIVERED',
    },
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
        'Active loans'
      )
    )
}

/**
 * Get overdue loans
 */
export const getOverdueLoans = async (
  req: Request,
  res: Response
): Promise<void> => {
  const page = parseInt((req.query.page as string) || '1')
  const limit = parseInt((req.query.limit as string) || '20')

  // Get all delivered loans and filter client-side for overdue
  const result = await exitNotesService.findAll(
    {
      type: ExitNoteType.LOAN,
      status: 'DELIVERED',
    },
    page,
    limit
  )

  const now = new Date()
  const overdue = result.data.filter((loan: any) => {
    return (
      loan.expectedReturnDate &&
      new Date(loan.expectedReturnDate) < now &&
      !loan.returnedAt
    )
  })

  res
    .status(200)
    .json(
      ApiResponse.paginated(
        overdue,
        overdue.length,
        page,
        limit,
        'Overdue loans'
      )
    )
}

/**
 * Record loan return
 */
export const recordLoanReturn = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { exitNoteId } = req.params
  const { returnedQuantity, condition, notes } = req.body
  const userId = (req as any).userId

  // Update the exit note with return information
  const exitNote = await exitNotesService.findById(exitNoteId)
  if (!exitNote) {
    res.status(404).json(ApiResponse.error('Loan exit note not found'))
    return
  }

  const updated = await exitNotesService.update(exitNoteId, {
    returnedAt: new Date(),
    notes: `${exitNote.notes || ''}\n[RETURNED]\nCondition: ${condition}\nNotes: ${notes}`,
  })

  res
    .status(200)
    .json(ApiResponse.success(updated, 'Loan return recorded successfully'))
}
