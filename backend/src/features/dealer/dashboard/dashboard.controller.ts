import { Request, Response } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import service from './dashboard.service.js'

class DealerDashboardController {
  getOverview = asyncHandler(async (req: Request, res: Response) => {
    if (!req.empresaId) throw new Error('empresaId not set by middleware')
    const data = await service.getOverview(req.empresaId, req.prisma)
    return ApiResponse.success(res, data, 'Dashboard de concesionario obtenido exitosamente')
  })
}

export default new DealerDashboardController()
