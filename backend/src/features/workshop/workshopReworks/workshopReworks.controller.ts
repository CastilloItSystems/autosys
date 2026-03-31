// backend/src/features/workshop/workshopReworks/workshopReworks.controller.ts
import type { Request, Response } from 'express'
import prisma from '../../../services/prisma.service.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import {
  findAllReworks,
  findReworkById,
  createRework,
  updateRework,
  changeReworkStatus,
} from './workshopReworks.service.js'

export const getAll = async (req: Request, res: Response) => {
  const result = await findAllReworks(prisma, req.empresaId!, req.validatedQuery as any)
  return ApiResponse.success(res, result)
}

export const getOne = async (req: Request, res: Response) => {
  const item = await findReworkById(prisma, req.params.id as string, req.empresaId!)
  return ApiResponse.success(res, item)
}

export const create = async (req: Request, res: Response) => {
  const item = await createRework(prisma, req.empresaId!, { ...req.body, createdBy: (req as any).user?.id ?? 'system' })
  return ApiResponse.created(res, item, 'Retrabajo registrado')
}

export const update = async (req: Request, res: Response) => {
  const item = await updateRework(prisma, req.params.id as string, req.empresaId!, req.body)
  return ApiResponse.success(res, item, 'Retrabajo actualizado')
}

export const changeStatus = async (req: Request, res: Response) => {
  const item = await changeReworkStatus(prisma, req.params.id as string, req.empresaId!, req.body.status)
  return ApiResponse.success(res, item, `Retrabajo marcado como ${item.status}`)
}
