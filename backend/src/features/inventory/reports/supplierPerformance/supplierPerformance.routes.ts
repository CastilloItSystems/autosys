/**
 * Supplier Performance Report Routes
 * GET /api/inventory/reports/supplier-performance?page=&limit=
 */

import { Router, Request, Response } from 'express'
import { getSupplierPerformanceReport } from './supplierPerformance.service.js'
import { ApiResponse } from '../../../../shared/utils/apiResponse.js'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50
    const empresaId = (req as any).empresaId as string | undefined

    const result = await getSupplierPerformanceReport(
      page,
      limit,
      empresaId,
      (req as any).prisma || undefined
    )

    res.status(200).json({
      success: true,
      message: 'Supplier performance report',
      data: result.data,
      summary: result.summary,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    ApiResponse.error(res, error.message || 'Error generating supplier performance report', 500)
  }
})

export default router
