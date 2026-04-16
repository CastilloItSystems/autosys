import { Request, Response } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { executeCrmAutomationChecks } from './crm-automations.service.js'

function getEmpresaId(req: Request): string {
  if (!req.empresaId) throw new Error('empresaId not set by middleware')
  return req.empresaId
}

export const runChecks = asyncHandler(async (req: Request, res: Response) => {
  const result = await executeCrmAutomationChecks(req.prisma)
  return ApiResponse.success(res, result, 'Automatizaciones CRM ejecutadas')
})

export const getAlerts = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const { status, type, limit } = req.query
  const limitNum = Number(limit) > 0 ? Math.min(Number(limit), 200) : 50

  const rows = await req.prisma.crmAutomationAlert.findMany({
    where: {
      empresaId,
      status: status ? (String(status) as any) : 'OPEN',
      type: type ? (String(type) as any) : undefined,
    },
    orderBy: { createdAt: 'desc' },
    take: limitNum,
  })

  return ApiResponse.success(res, rows, 'Alertas CRM obtenidas')
})
