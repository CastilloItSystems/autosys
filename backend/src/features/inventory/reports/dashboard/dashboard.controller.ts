/**
 * Dashboard Report Controller
 * Route handlers for dashboard metrics
 */

import { Request, Response } from 'express'
import { getDashboardMetrics } from './dashboard.service'
import { ApiResponse } from '../../../../shared/utils/apiResponse'

/**
 * Get dashboard metrics
 */
export const getDashboard = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const metrics = await getDashboardMetrics((req as any).prisma || undefined)
    ApiResponse.success(res, metrics, 'Dashboard metrics retrieved')
  } catch (error: any) {
    ApiResponse.error(
      res,
      error.message || 'Failed to retrieve dashboard metrics',
      500
    )
  }
}

/**
 * Get dashboard summary
 */
export const getDashboardSummary = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const metrics = await getDashboardMetrics((req as any).prisma || undefined)

    const summary = {
      stockHealth: metrics.stockHealth,
      movements: metrics.movements,
      alerts: metrics.alerts,
      totalStockValue: metrics.totalStockValue,
      topMovingItems: metrics.topMovingItems.slice(0, 5),
    }

    ApiResponse.success(res, summary, 'Dashboard summary retrieved')
  } catch (error: any) {
    ApiResponse.error(res, error.message || 'Failed to retrieve summary', 500)
  }
}

export default {
  getDashboard,
  getDashboardSummary,
}
