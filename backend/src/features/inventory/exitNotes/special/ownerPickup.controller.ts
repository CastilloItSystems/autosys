/**
 * Owner Pickup Exit Type Controller
 * Handles owner/partner collecting items with verification
 */

import { Request, Response } from 'express'
import { ExitNotesService } from '../exitNotes.service'
import { ApiResponse } from '../../../../shared/utils/api-response'
import { ExitNoteType } from '../exitNotes.interface'

const exitNotesService = ExitNotesService.getInstance()

/**
 * Create owner pickup exit note
 */
export const createOwnerPickupExit = async (
  req: Request,
  res: Response
): Promise<void> => {
  const {
    warehouseId,
    items,
    ownerName,
    ownerId,
    ownerRole,
    reason,
    idNumber,
  } = req.body
  const userId = (req as any).userId

  const exitNote = await exitNotesService.create(
    {
      type: ExitNoteType.OWNER_PICKUP,
      warehouseId,
      items,
      recipientName: ownerName,
      recipientId: ownerId,
      reason: reason || `Owner pickup by ${ownerName}`,
      reference: idNumber, // ID for verification
    },
    userId
  )

  res
    .status(201)
    .json(
      ApiResponse.created(
        exitNote,
        'Owner pickup exit note created successfully'
      )
    )
}

/**
 * Get owner pickup exit notes
 */
export const getOwnerPickupExits = async (
  req: Request,
  res: Response
): Promise<void> => {
  const page = parseInt((req.query.page as string) || '1')
  const limit = parseInt((req.query.limit as string) || '20')
  const { ownerId } = req.query

  const result = await exitNotesService.findByType(
    ExitNoteType.OWNER_PICKUP,
    page,
    limit
  )

  // Filter by owner if provided
  const filtered =
    ownerId && typeof ownerId === 'string'
      ? result.data.filter((exit: any) => exit.recipientId === ownerId)
      : result.data

  res
    .status(200)
    .json(
      ApiResponse.paginated(
        filtered,
        filtered.length,
        page,
        limit,
        'Owner pickup exits'
      )
    )
}

/**
 * Get owner pickup exit details
 */
export const getOwnerPickupExitDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { exitNoteId } = req.params

  const exitNote = await exitNotesService.findById(exitNoteId)
  if (!exitNote || exitNote.type !== ExitNoteType.OWNER_PICKUP) {
    res.status(404).json(ApiResponse.error('Owner pickup exit note not found'))
    return
  }

  res
    .status(200)
    .json(
      ApiResponse.success(exitNote, 'Owner pickup exit note details retrieved')
    )
}

/**
 * Verify owner identity
 */
export const verifyOwnerIdentity = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { exitNoteId } = req.params
  const { idNumber, verificationMethod, verifiedBy } = req.body

  const exitNote = await exitNotesService.findById(exitNoteId)
  if (!exitNote) {
    res.status(404).json(ApiResponse.error('Exit note not found'))
    return
  }

  // Verify ID matches
  const verified = exitNote.reference === idNumber

  if (!verified) {
    res
      .status(400)
      .json(ApiResponse.error('ID verification failed - ID does not match'))
    return
  }

  // Mark as ready (approved for pickup)
  const updated = await exitNotesService.markAsReady(exitNoteId, verifiedBy)

  res.status(200).json(
    ApiResponse.success(
      {
        ...updated,
        verified: true,
        verificationMethod,
        verifiedBy,
        readyForPickup: true,
      },
      'Owner identity verified successfully'
    )
  )
}

/**
 * Record ownership transfer
 */
export const recordOwnershipTransfer = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { exitNoteId } = req.params
  const { signature, pickupTime, notes, pickedBy } = req.body
  const userId = (req as any).userId

  const exitNote = await exitNotesService.findById(exitNoteId)
  if (!exitNote) {
    res.status(404).json(ApiResponse.error('Exit note not found'))
    return
  }

  // Record delivery as pickup completion
  const updated = await exitNotesService.deliver(exitNoteId, userId)

  res.status(200).json(
    ApiResponse.success(
      {
        ...updated,
        pickedBy,
        signature: !!signature,
        pickupTime: pickupTime || new Date(),
        notes,
        ownershipTransferred: true,
      },
      'Ownership transfer recorded successfully'
    )
  )
}

/**
 * Get owner pickup summary
 */
export const getOwnerPickupSummary = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { ownerId } = req.query

  const result = await exitNotesService.findByType(
    ExitNoteType.OWNER_PICKUP,
    1,
    1000
  )

  const filtered =
    ownerId && typeof ownerId === 'string'
      ? result.data.filter((exit: any) => exit.recipientId === ownerId)
      : result.data

  const totalItems = filtered.reduce(
    (sum: number, exit: any) =>
      sum +
      exit.items.reduce(
        (itemSum: number, item: any) => itemSum + item.quantity,
        0
      ),
    0
  )

  const byStatus: Record<string, number> = {}
  filtered.forEach((exit: any) => {
    byStatus[exit.status] = (byStatus[exit.status] || 0) + 1
  })

  res.status(200).json(
    ApiResponse.success(
      {
        ownerId: ownerId || 'All Owners',
        totalPickups: filtered.length,
        totalItems,
        byStatus,
        pickups: filtered,
      },
      'Owner pickup summary'
    )
  )
}

/**
 * Get pending owner pickups
 */
export const getPendingOwnerPickups = async (
  req: Request,
  res: Response
): Promise<void> => {
  const page = parseInt((req.query.page as string) || '1')
  const limit = parseInt((req.query.limit as string) || '20')

  const result = await exitNotesService.findAll(
    {
      type: ExitNoteType.OWNER_PICKUP,
      status: 'READY',
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
        'Pending owner pickups ready for collection'
      )
    )
}
