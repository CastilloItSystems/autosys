/**
 * Movements Report Controller
 */

import { Request, Response } from 'express'
import { getMovementsReport, getMovementsSummary } from './movements.service.js'
import { ApiResponse } from '../../../../shared/utils/apiResponse.js'

/**
 * Get detailed movements report with pagination and filters
 */
export const getMovementsReportHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50
    const dateFrom = req.query.dateFrom as string | undefined
    const dateTo = req.query.dateTo as string | undefined
    const warehouseId = req.query.warehouseId as string | undefined
    const itemId = req.query.itemId as string | undefined
    const type = req.query.type as string | undefined

    const filters: any = {
      page,
      limit,
    }

    if (dateFrom) {
      filters.dateFrom = new Date(dateFrom)
    }
    if (dateTo) {
      filters.dateTo = new Date(dateTo)
    }
    if (warehouseId) {
      filters.warehouseId = warehouseId
    }
    if (itemId) {
      filters.itemId = itemId
    }
    if (type) {
      filters.type = type
    }

    const result = await getMovementsReport(
      filters,
      (req as any).prisma || undefined
    )

    ApiResponse.paginated(
      res,
      result.data,
      page,
      limit,
      result.total,
      'Movements report'
    )
  } catch (error: any) {
    ApiResponse.error(res, error.message, 500)
  }
}

/**
 * Get movements summary (counts by type, warehouse, etc.)
 */
export const getMovementsSummaryHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const dateFrom = req.query.dateFrom as string | undefined
    const dateTo = req.query.dateTo as string | undefined

    const dateFromObj = dateFrom ? new Date(dateFrom) : undefined
    const dateToObj = dateTo ? new Date(dateTo) : undefined

    const summary = await getMovementsSummary(
      dateFromObj,
      dateToObj,
      (req as any).prisma || undefined
    )

    ApiResponse.success(res, summary, 'Movements summary')
  } catch (error: any) {
    ApiResponse.error(res, error.message, 500)
  }
}

export default { getMovementsReportHandler, getMovementsSummaryHandler }
