import { Request, Response } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import service from './automations.service.js'

class DealerAutomationsController {
  getAlerts = asyncHandler(async (req: Request, res: Response) => {
    if (!req.empresaId) throw new Error('empresaId not set by middleware')
    const alerts = await service.getAlerts(req.empresaId, req.prisma)
    return ApiResponse.success(res, alerts, 'Alertas de automatización de concesionario obtenidas exitosamente')
  })

  runChecks = asyncHandler(async (req: Request, res: Response) => {
    if (!req.empresaId) throw new Error('empresaId not set by middleware')
    const summary = await service.runChecks(req.empresaId, req.prisma)
    return ApiResponse.success(res, summary, 'Verificaciones de automatización ejecutadas exitosamente')
  })
}

export default new DealerAutomationsController()
