// backend/src/features/finance/dashboard/financeDashboard.controller.ts

import { Request, Response } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import FinanceDashboardService from './financeDashboard.service.js'

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  if (!req.empresaId) throw new Error('empresaId not set')
  const svc = new FinanceDashboardService(req.prisma as any)
  const data = await svc.getDashboard(req.empresaId)
  return ApiResponse.success(res, data)
})

export const getReceivables = asyncHandler(async (req: Request, res: Response) => {
  if (!req.empresaId) throw new Error('empresaId not set')
  const svc = new FinanceDashboardService(req.prisma as any)
  const data = await svc.getReceivables(req.empresaId)
  return ApiResponse.success(res, data)
})
