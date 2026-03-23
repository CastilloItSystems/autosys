/**
 * Sales Dashboard Report Controller
 */

import { Request, Response } from 'express'
import { getSalesDashboard } from './dashboard.service.js'
import { ApiResponse } from '../../../../shared/utils/apiResponse.js'

export const getSalesDashboardHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const empresaId = (req as any).empresaId as string | undefined
    const result = await getSalesDashboard(empresaId, (req as any).prisma || undefined)
    res.status(200).json({
      success: true,
      message: 'Sales dashboard',
      data: result,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    ApiResponse.error(res, error.message, 500)
  }
}

export default { getSalesDashboardHandler }
