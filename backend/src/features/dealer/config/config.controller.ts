import { Request, Response } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { DealerPolicyResponseDTO, UpsertDealerPolicyDTO } from './config.dto.js'
import dealerConfigService from './config.service.js'

function getEmpresaId(req: Request): string {
  if (!req.empresaId) throw new Error('empresaId not set by middleware')
  return req.empresaId
}

function getUserId(req: Request): string {
  const userId = req.user?.userId
  if (!userId) throw new Error('user not set by middleware')
  return userId
}

class DealerConfigController {
  get = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const policy = await dealerConfigService.get(empresaId, req.prisma)
    return ApiResponse.success(res, new DealerPolicyResponseDTO(policy), 'Configuración comercial obtenida exitosamente')
  })

  upsert = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = getUserId(req)
    const dto = new UpsertDealerPolicyDTO(req.body)
    const policy = await dealerConfigService.upsert(dto, empresaId, userId, req.prisma)
    return ApiResponse.success(res, new DealerPolicyResponseDTO(policy), 'Configuración comercial guardada exitosamente')
  })
}

export default new DealerConfigController()
