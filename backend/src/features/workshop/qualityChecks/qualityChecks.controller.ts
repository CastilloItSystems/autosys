// backend/src/features/workshop/qualityChecks/qualityChecks.controller.ts
import type { Request, Response } from 'express'
import prisma from '../../../services/prisma.service.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import {
  findQualityCheckById, findQualityCheckBySOId,
  createQualityCheck, submitQualityCheck,
} from './qualityChecks.service.js'
import { CreateQualityCheckDTO, SubmitQualityCheckDTO, QualityCheckResponseDTO } from './qualityChecks.dto.js'

export const getByServiceOrder = async (req: Request, res: Response) => {
  const item = await findQualityCheckBySOId(prisma, req.params.serviceOrderId as string, req.empresaId!)
  return ApiResponse.success(res, new QualityCheckResponseDTO(item))
}

export const getOne = async (req: Request, res: Response) => {
  const item = await findQualityCheckById(prisma, req.params.id as string, req.empresaId!)
  return ApiResponse.success(res, new QualityCheckResponseDTO(item))
}

export const create = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string
  const item = await createQualityCheck(prisma, req.empresaId!, userId, new CreateQualityCheckDTO(req.body))
  return ApiResponse.created(res, new QualityCheckResponseDTO(item), 'Control de calidad iniciado')
}

export const submit = async (req: Request, res: Response) => {
  const item = await submitQualityCheck(prisma, req.params.id as string, req.empresaId!, new SubmitQualityCheckDTO(req.body))
  const msg = item.status === 'PASSED' ? 'Control de calidad aprobado — OT lista para entrega' : 'Control de calidad reprobado — OT regresó a IN_PROGRESS'
  return ApiResponse.success(res, new QualityCheckResponseDTO(item), msg)
}
