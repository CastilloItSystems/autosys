// backend/src/features/workshop/qualityChecks/qualityChecks.controller.ts
import type { Request, Response } from 'express'
import prisma from '../../../services/prisma.service.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import {
  findAllQualityChecks,
  findQualityCheckById,
  findQualityCheckBySOId,
  createQualityCheck,
  submitQualityCheck,
} from './qualityChecks.service.js'
import {
  CreateQualityCheckDTO,
  SubmitQualityCheckDTO,
  QualityCheckResponseDTO,
} from './qualityChecks.dto.js'
import { WORKSHOP_MESSAGES } from '../shared/constants/messages.js'

export const getAll = async (req: Request, res: Response) => {
  const result = await findAllQualityChecks(
    prisma,
    req.empresaId!,
    req.validatedQuery as any
  )
  const items = result.data.map((i) => new QualityCheckResponseDTO(i))
  const meta = PaginationHelper.getMeta(result.page, result.limit, result.total)
  return res.status(200).json({
    success: true,
    message: 'Datos obtenidos exitosamente',
    data: items,
    meta,
    timestamp: new Date().toISOString(),
  })
}

export const getByServiceOrder = async (req: Request, res: Response) => {
  const item = await findQualityCheckBySOId(
    prisma,
    req.params.serviceOrderId as string,
    req.empresaId!
  )
  return ApiResponse.success(res, new QualityCheckResponseDTO(item))
}

export const getOne = async (req: Request, res: Response) => {
  const item = await findQualityCheckById(
    prisma,
    req.params.id as string,
    req.empresaId!
  )
  return ApiResponse.success(res, new QualityCheckResponseDTO(item))
}

export const create = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId as string
  const item = await createQualityCheck(
    prisma,
    req.empresaId!,
    userId,
    new CreateQualityCheckDTO(req.body)
  )
  return ApiResponse.created(
    res,
    new QualityCheckResponseDTO(item),
    WORKSHOP_MESSAGES.qualityCheck.created
  )
}

export const submit = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId as string
  const item = await submitQualityCheck(
    prisma,
    req.params.id as string,
    req.empresaId!,
    new SubmitQualityCheckDTO(req.body),
    userId
  )
  const msg =
    item.status === 'PASSED'
      ? WORKSHOP_MESSAGES.qualityCheck.passed
      : WORKSHOP_MESSAGES.qualityCheck.failed
  return ApiResponse.success(res, new QualityCheckResponseDTO(item), msg)
}
