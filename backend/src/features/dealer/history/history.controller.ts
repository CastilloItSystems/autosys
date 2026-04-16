import { Request, Response } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import service from './history.service.js'

class DealerHistoryController {
  getAll = asyncHandler(async (req: Request, res: Response) => {
    if (!req.empresaId) throw new Error('empresaId not set by middleware')
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 20
    const search = typeof req.query.search === 'string' ? req.query.search : undefined

    const result = await service.getHistory(req.empresaId, req.prisma, { page, limit, search })
    return ApiResponse.paginated(res, result.data, page, limit, result.total, 'Historial comercial obtenido exitosamente')
  })
}

export default new DealerHistoryController()
