/**
 * Sample/Promotional Exit Type Controller
 * Handles free samples and promotional units
 */

import { Request, Response } from 'express'
import { ExitNotesService } from '../exitNotes.service'
import { ApiResponse } from '../../../../shared/utils/apiResponse'
import { ExitNoteType } from '../exitNotes.interface'

const exitNotesService = ExitNotesService.getInstance()

/**
 * Create sample exit note
 */
export const createSampleExit = async (
  req: Request,
  res: Response
): Promise<void> => {
  const {
    warehouseId,
    items,
    recipientName,
    campaign,
    targetAudience,
    reason,
  } = req.body
  const userId = (req as any).userId

  const exitNote = await exitNotesService.create(
    {
      type: ExitNoteType.SAMPLE,
      warehouseId,
      items,
      recipientName,
      reason: reason || `Promotional sample - Campaign: ${campaign}`,
      reference: campaign,
    },
    userId
  )

  res
    .status(201)
    .json(
      ApiResponse.created(exitNote, 'Sample exit note created successfully')
    )
}

/**
 * Get sample exit notes
 */
export const getSampleExits = async (
  req: Request,
  res: Response
): Promise<void> => {
  const page = parseInt((req.query.page as string) || '1')
  const limit = parseInt((req.query.limit as string) || '20')
  const { campaign } = req.query

  const result = await exitNotesService.findByType(
    ExitNoteType.SAMPLE,
    page,
    limit
  )

  // Filter by campaign if provided
  const filtered =
    campaign && typeof campaign === 'string'
      ? result.data.filter((exit: any) => exit.reference === campaign)
      : result.data

  res
    .status(200)
    .json(
      ApiResponse.paginated(
        filtered,
        filtered.length,
        page,
        limit,
        'Sample exits'
      )
    )
}

/**
 * Get sample exit details
 */
export const getSampleExitDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { exitNoteId } = req.params

  const exitNote = await exitNotesService.findById(exitNoteId)
  if (!exitNote || exitNote.type !== ExitNoteType.SAMPLE) {
    res.status(404).json(ApiResponse.error('Sample exit note not found'))
    return
  }

  res
    .status(200)
    .json(ApiResponse.success(exitNote, 'Sample exit note details retrieved'))
}

/**
 * Get sample distribution by campaign
 */
export const getSamplesByCampaign = async (
  req: Request,
  res: Response
): Promise<void> => {
  const result = await exitNotesService.findByType(ExitNoteType.SAMPLE, 1, 1000)

  // Group by campaign (reference)
  const campaigns: Record<string, any> = {}
  result.data.forEach((exit: any) => {
    const campaign = exit.reference || 'Uncategorized'
    if (!campaigns[campaign]) {
      campaigns[campaign] = {
        campaign,
        totalExits: 0,
        totalUnits: 0,
        recipients: [],
      }
    }
    campaigns[campaign].totalExits++
    campaigns[campaign].totalUnits += exit.items.reduce(
      (sum: number, item: any) => sum + item.quantity,
      0
    )
    if (exit.recipientName) {
      campaigns[campaign].recipients.push(exit.recipientName)
    }
  })

  res
    .status(200)
    .json(ApiResponse.success(campaigns, 'Sample distribution by campaign'))
}

/**
 * Get sample impact tracking
 */
export const getSampleImpactTracking = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { campaign, startDate, endDate } = req.query

  const result = await exitNotesService.findAll(
    {
      type: ExitNoteType.SAMPLE,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    },
    1,
    1000
  )

  const filteredResults =
    campaign && typeof campaign === 'string'
      ? result.data.filter((exit: any) => exit.reference === campaign)
      : result.data

  const totalUnits = filteredResults.reduce(
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
        campaign: campaign || 'All Campaigns',
        period: {
          startDate,
          endDate,
        },
        totalsample: filteredResults.length,
        totalUnits,
        averageUnitsPerExit: filteredResults.length
          ? Math.round(totalUnits / filteredResults.length)
          : 0,
        data: filteredResults,
      },
      'Sample impact tracking'
    )
  )
}

/**
 * Approve sample exit
 */
export const approveSampleExit = async (
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
    .json(ApiResponse.success(updated, 'Sample exit approved successfully'))
}
