// backend/src/features/workshop/workshopReworks/workshopReworks.controller.ts
import type { Request, Response } from 'express'
import prisma from '../../../services/prisma.service.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import {
  findAllReworks,
  findReworkById,
  createRework,
  updateRework,
  changeReworkStatus,
} from './workshopReworks.service.js'
import { WORKSHOP_MESSAGES } from '../shared/constants/messages.js'

export const getAll = async (req: Request, res: Response) => {
  const result = await findAllReworks(
    prisma,
    req.empresaId!,
    req.validatedQuery as any
  )
  const items = result.data
  const meta = PaginationHelper.getMeta(result.page, result.limit, result.total)
  return res.status(200).json({
    success: true,
    message: 'Datos obtenidos exitosamente',
    data: items,
    meta,
    timestamp: new Date().toISOString(),
  })
}

export const getOne = async (req: Request, res: Response) => {
  const item = await findReworkById(
    prisma,
    req.params.id as string,
    req.empresaId!
  )
  return ApiResponse.success(res, item)
}

export const create = async (req: Request, res: Response) => {
  const item = await createRework(prisma, req.empresaId!, {
    ...req.body,
    createdBy: (req as any).user?.userId ?? 'system',
  })
  return ApiResponse.created(res, item, WORKSHOP_MESSAGES.rework.created)
}

export const update = async (req: Request, res: Response) => {
  const item = await updateRework(
    prisma,
    req.params.id as string,
    req.empresaId!,
    req.body
  )
  return ApiResponse.success(res, item, WORKSHOP_MESSAGES.rework.updated)
}

export const changeStatus = async (req: Request, res: Response) => {
  const item = await changeReworkStatus(
    prisma,
    req.params.id as string,
    req.empresaId!,
    req.body.status
  )
  return ApiResponse.success(res, item, WORKSHOP_MESSAGES.rework.statusChanged)
}
