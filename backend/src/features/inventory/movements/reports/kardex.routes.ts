/**
 * Kardex Report Routes
 * GET /api/inventory/reports/kardex?itemId=&warehouseId=&dateFrom=&dateTo=&page=&limit=
 */

import { Router, Request, Response } from 'express'
import { getKardexReport } from './kardex.service.js'
import { ApiResponse } from '../../../../shared/utils/apiResponse.js'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  try {
    const itemId = req.query.itemId as string
    if (!itemId) {
      ApiResponse.badRequest(res, 'itemId es requerido')
      return
    }

    const empresaId = (req as any).empresaId as string | undefined
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50

    const result = await getKardexReport({
      itemId,
      warehouseId: req.query.warehouseId as string | undefined,
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo: req.query.dateTo as string | undefined,
      page,
      limit,
      empresaId,
      prismaClient: (req as any).prisma || undefined,
    })

    res.status(200).json({
      success: true,
      message: 'Kardex report',
      data: result.data,
      meta: {
        itemId: result.itemId,
        itemName: result.itemName,
        itemSKU: result.itemSKU,
        warehouseId: result.warehouseId,
        warehouseName: result.warehouseName,
        dateFrom: result.dateFrom,
        dateTo: result.dateTo,
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        openingBalance: result.openingBalance,
        closingBalance: result.closingBalance,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    ApiResponse.error(res, error.message || 'Error generating kardex report', 500)
  }
})

export default router
