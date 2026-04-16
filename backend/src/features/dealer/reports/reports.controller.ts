import { Request, Response } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import service from './reports.service.js'

class DealerReportsController {
  getExecutive = asyncHandler(async (req: Request, res: Response) => {
    if (!req.empresaId) throw new Error('empresaId not set by middleware')
    const data = await service.getExecutiveReport(req.empresaId, req.prisma)
    return ApiResponse.success(res, data, 'Reporte ejecutivo de concesionario obtenido exitosamente')
  })

  getPipeline = asyncHandler(async (req: Request, res: Response) => {
    if (!req.empresaId) throw new Error('empresaId not set by middleware')
    const data = await service.getPipelineBreakdown(req.empresaId, req.prisma)
    return ApiResponse.success(res, data, 'Reporte de pipeline de concesionario obtenido exitosamente')
  })
}

export default new DealerReportsController()
