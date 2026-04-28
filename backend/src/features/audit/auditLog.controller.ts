import { Request, Response } from 'express'
import { asyncHandler } from '../../shared/middleware/asyncHandler.middleware.js'
import { ApiResponse } from '../../shared/utils/apiResponse.js'
import { findAuditLogs } from './auditLog.service.js'

function getEmpresaId(req: Request): string {
  if (!req.empresaId) throw new Error('empresaId not set by middleware')
  return req.empresaId
}

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const result = await findAuditLogs(
    getEmpresaId(req),
    req.validatedQuery as any
  )

  return ApiResponse.paginated(
    res,
    result.items,
    result.page,
    result.limit,
    result.total,
    'Logs de auditoría obtenidos exitosamente'
  )
})
