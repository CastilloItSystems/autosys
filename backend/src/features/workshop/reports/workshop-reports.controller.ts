// backend/src/features/workshop/reports/workshop-reports.controller.ts
// OPCIÓN C: Reports Controller

import type { Request, Response } from 'express'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import {
  getServiceOrdersReport,
  getTechnicianProductivityReport,
  getOperationalEfficiencyReport,
  getMaterialsUsedReport,
  getWarrantyClaimsReport,
  getFinancialSummaryReport,
  getAllReports,
} from './workshop-reports.service.js'

/**
 * Get all reports at once
 */
export const getAllReportsData = asyncHandler(
  async (req: Request, res: Response) => {
    const empresaId = req.empresaId!
    const { startDate, endDate } = req.query
    const prisma =
      (req as any).prisma ||
      require('../../../services/prisma.service.js').default

    const filters = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    }

    const reports = await getAllReports(prisma, empresaId, filters)
    return ApiResponse.success(res, reports)
  }
)

/**
 * Get service orders report
 */
export const getServiceOrders = asyncHandler(
  async (req: Request, res: Response) => {
    const empresaId = req.empresaId!
    const { startDate, endDate } = req.query
    const prisma =
      (req as any).prisma ||
      require('../../../services/prisma.service.js').default

    const report = await getServiceOrdersReport(prisma, empresaId, {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    })

    return ApiResponse.success(res, report)
  }
)

/**
 * Get productivity report
 */
export const getProductivity = asyncHandler(
  async (req: Request, res: Response) => {
    const empresaId = req.empresaId!
    const { startDate, endDate } = req.query
    const prisma =
      (req as any).prisma ||
      require('../../../services/prisma.service.js').default

    const report = await getTechnicianProductivityReport(prisma, empresaId, {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    })

    return ApiResponse.success(res, report)
  }
)

/**
 * Get efficiency report
 */
export const getEfficiency = asyncHandler(
  async (req: Request, res: Response) => {
    const empresaId = req.empresaId!
    const { startDate, endDate } = req.query
    const prisma =
      (req as any).prisma ||
      require('../../../services/prisma.service.js').default

    const report = await getOperationalEfficiencyReport(prisma, empresaId, {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    })

    return ApiResponse.success(res, report)
  }
)

/**
 * Get materials report
 */
export const getMaterials = asyncHandler(
  async (req: Request, res: Response) => {
    const empresaId = req.empresaId!
    const { startDate, endDate } = req.query
    const prisma =
      (req as any).prisma ||
      require('../../../services/prisma.service.js').default

    const report = await getMaterialsUsedReport(prisma, empresaId, {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    })

    return ApiResponse.success(res, report)
  }
)

/**
 * Get warranty report
 */
export const getWarranty = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = req.empresaId!
  const { startDate, endDate } = req.query
  const prisma =
    (req as any).prisma ||
    require('../../../services/prisma.service.js').default

  const report = await getWarrantyClaimsReport(prisma, empresaId, {
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
  })

  return ApiResponse.success(res, report)
})

/**
 * Get financial report
 */
export const getFinancial = asyncHandler(
  async (req: Request, res: Response) => {
    const empresaId = req.empresaId!
    const { startDate, endDate } = req.query
    const prisma =
      (req as any).prisma ||
      require('../../../services/prisma.service.js').default

    const report = await getFinancialSummaryReport(prisma, empresaId, {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    })

    return ApiResponse.success(res, report)
  }
)
