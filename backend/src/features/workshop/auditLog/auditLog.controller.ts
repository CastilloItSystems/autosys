// backend/src/features/workshop/auditLog/auditLog.controller.ts
import type { Request, Response } from 'express'
import prisma from '../../../services/prisma.service.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { findAuditLogs } from './auditLog.service.js'

export const getAll = async (req: Request, res: Response) => {
  const result = await findAuditLogs(prisma, req.empresaId!, req.validatedQuery as any)
  return ApiResponse.success(res, result)
}
