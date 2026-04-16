import { Request, Response } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import service from './integrations.service.js'

class DealerIntegrationsController {
  getStatus = asyncHandler(async (req: Request, res: Response) => {
    if (!req.empresaId) throw new Error('empresaId not set by middleware')
    const data = await service.getStatus(req.empresaId, req.prisma)
    return ApiResponse.success(res, data, 'Estado de integraciones de concesionario obtenido exitosamente')
  })
}

export default new DealerIntegrationsController()
