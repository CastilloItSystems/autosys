import { Request, Response } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import loyaltyService from './loyalty.service.js'
import { CreateLoyaltyRecordDTO } from './loyalty.dto.js'

function getEmpresaId(req: Request): string {
  if (!req.empresaId) throw new Error('empresaId not set by middleware')
  return req.empresaId
}

class LoyaltyController {
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { customerId, status, type, page, limit } = req.query
    const pageNum = Number(page) || 1
    const limitNum = Number(limit) > 0 ? Math.min(Number(limit), 500) : 20

    const data = await loyaltyService.getOverview(
      req.prisma,
      empresaId,
      {
        customerId: customerId ? String(customerId) : undefined,
        status: status ? String(status) : undefined,
        type: type ? String(type) : undefined,
      },
      pageNum,
      limitNum
    )

    return ApiResponse.success(res, data, 'Loyalty obtenido exitosamente')
  })

  create = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId
    if (!userId) throw new Error('user.id no disponible en request')

    const dto = new CreateLoyaltyRecordDTO(req.body)
    const result = await loyaltyService.create(req.prisma, empresaId, userId, dto)
    return ApiResponse.created(res, result, 'Registro de loyalty creado exitosamente')
  })
}

export default new LoyaltyController()
