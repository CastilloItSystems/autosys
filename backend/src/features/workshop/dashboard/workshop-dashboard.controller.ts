// backend/src/features/workshop/dashboard/workshop-dashboard.controller.ts
// FASE 3.4: Workshop Dashboard Controller

import type { Request, Response } from 'express'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import {
  getWorkshopDashboard,
  getDashboardSummary,
} from './workshop-dashboard.service.js'

/**
 * Get real-time workshop dashboard data
 */
export const getDashboard = asyncHandler(
  async (req: Request, res: Response) => {
    const empresaId = req.empresaId!
    const prisma =
      (req as any).prisma ||
      require('../../../services/prisma.service.js').default

    const dashboardData = await getWorkshopDashboard(prisma, empresaId)

    return ApiResponse.success(res, dashboardData, 'Dashboard data retrieved')
  }
)

/**
 * Get dashboard summary for a date range
 */
export const getDashboardSummaryData = asyncHandler(
  async (req: Request, res: Response) => {
    const empresaId = req.empresaId!
    const { startDate, endDate } = req.query
    const prisma =
      (req as any).prisma ||
      require('../../../services/prisma.service.js').default

    if (!startDate || !endDate) {
      return ApiResponse.badRequest(res, 'startDate y endDate son requeridos')
    }

    const start = new Date(startDate as string)
    const end = new Date(endDate as string)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return ApiResponse.badRequest(
        res,
        'Formato de fecha inválido (use ISO 8601)'
      )
    }

    const summary = await getDashboardSummary(prisma, empresaId, start, end)

    return ApiResponse.success(res, summary, 'Dashboard summary retrieved')
  }
)
