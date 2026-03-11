/**
 * Donation Exit Type Controller
 * Handles charitable donations with authorization tracking
 */

import { Request, Response } from 'express'
import { ExitNotesService } from '../exitNotes.service'
import { ApiResponse } from '../../../../shared/utils/apiResponse'
import { ExitNoteType } from '../exitNotes.interface'

const exitNotesService = ExitNotesService.getInstance()

/**
 * Create donation exit note
 */
export const createDonationExit = async (
  req: Request,
  res: Response
): Promise<void> => {
  const {
    warehouseId,
    items,
    recipientName,
    recipientId,
    organization,
    authorizedBy,
    reason,
  } = req.body
  const userId = (req as any).userId

  const exitNote = await exitNotesService.create(
    {
      type: ExitNoteType.DONATION,
      warehouseId,
      items,
      recipientName,
      recipientId,
      reason: reason || `Donation to ${organization || recipientName}`,
      reference: authorizedBy,
      authorizedBy,
    },
    userId
  )

  res
    .status(201)
    .json(
      ApiResponse.created(exitNote, 'Donation exit note created successfully')
    )
}

/**
 * Get donation exit notes
 */
export const getDonationExits = async (
  req: Request,
  res: Response
): Promise<void> => {
  const page = parseInt((req.query.page as string) || '1')
  const limit = parseInt((req.query.limit as string) || '20')
  const { organization } = req.query

  const result = await exitNotesService.findByType(
    ExitNoteType.DONATION,
    page,
    limit
  )

  // Filter by organization if provided (stored in recipientName)
  const filtered =
    organization && typeof organization === 'string'
      ? result.data.filter((exit: any) => exit.recipientName === organization)
      : result.data

  res
    .status(200)
    .json(
      ApiResponse.paginated(
        filtered,
        filtered.length,
        page,
        limit,
        'Donation exits'
      )
    )
}

/**
 * Get donation exit details
 */
export const getDonationExitDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { exitNoteId } = req.params

  const exitNote = await exitNotesService.findById(exitNoteId)
  if (!exitNote || exitNote.type !== ExitNoteType.DONATION) {
    res.status(404).json(ApiResponse.error('Donation exit note not found'))
    return
  }

  res
    .status(200)
    .json(ApiResponse.success(exitNote, 'Donation exit note details retrieved'))
}

/**
 * Get donation statistics
 */
export const getDonationStatistics = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { startDate, endDate } = req.query

  const result = await exitNotesService.findAll(
    {
      type: ExitNoteType.DONATION,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    },
    1,
    1000
  )

  // Calculate statistics
  const totalDonations = result.data.length
  const totalUnits = result.data.reduce(
    (sum: number, exit: any) =>
      sum +
      exit.items.reduce(
        (itemSum: number, item: any) => itemSum + item.quantity,
        0
      ),
    0
  )

  // Group by organization
  const byOrganization: Record<string, any> = {}
  result.data.forEach((exit: any) => {
    const org = exit.recipientName || 'Unspecified'
    if (!byOrganization[org]) {
      byOrganization[org] = {
        organization: org,
        donationCount: 0,
        units: 0,
        lastDonation: null,
      }
    }
    byOrganization[org].donationCount++
    byOrganization[org].units += exit.items.reduce(
      (sum: number, item: any) => sum + item.quantity,
      0
    )
    byOrganization[org].lastDonation = exit.createdAt
  })

  res.status(200).json(
    ApiResponse.success(
      {
        period: {
          startDate: startDate || 'All time',
          endDate: endDate || 'All time',
        },
        totalDonations,
        totalUnits,
        averageUnitsPerDonation:
          totalDonations > 0 ? Math.round(totalUnits / totalDonations) : 0,
        byOrganization,
      },
      'Donation statistics'
    )
  )
}

/**
 * Approve donation
 */
export const approveDonation = async (
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
    .json(ApiResponse.success(updated, 'Donation approved successfully'))
}

/**
 * Get donation tax deduction report
 */
export const getDonationTaxReport = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { year } = req.query

  const result = await exitNotesService.findByType(
    ExitNoteType.DONATION,
    1,
    1000
  )

  // Filter by year if provided
  const filtered = year
    ? result.data.filter(
        (exit: any) =>
          new Date(exit.createdAt).getFullYear().toString() === year
      )
    : result.data

  const totalValue = filtered.reduce(
    (sum: number, exit: any) =>
      sum +
      exit.items.reduce(
        (itemSum: number, item: any) => itemSum + item.quantity,
        0
      ),
    0
  )

  res.status(200).json(
    ApiResponse.success(
      {
        year: year || new Date().getFullYear(),
        totalDonations: filtered.length,
        itemsValue: totalValue,
        donations: filtered,
      },
      'Donation tax deduction report'
    )
  )
}
