// backend/src/features/workshop/workshopBranches/workshopBranches.controller.ts
import type { Request, Response } from 'express'
import prisma from '../../../services/prisma.service.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import {
  findAllBranches,
  findBranchById,
  createBranch,
  updateBranch,
  toggleBranchActive,
} from './workshopBranches.service.js'
import { WORKSHOP_MESSAGES } from '../shared/constants/messages.js'

export const getAll = async (req: Request, res: Response) => {
  const result = await findAllBranches(prisma, req.empresaId!, req.validatedQuery as any)
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
  const item = await findBranchById(prisma, req.params.id as string, req.empresaId!)
  return ApiResponse.success(res, item)
}

export const create = async (req: Request, res: Response) => {
  const item = await createBranch(prisma, req.empresaId!, { ...req.body, createdBy: (req as any).user?.id ?? 'system' })
  return ApiResponse.created(res, item, WORKSHOP_MESSAGES.workshopBranch.created)
}

export const update = async (req: Request, res: Response) => {
  const item = await updateBranch(prisma, req.params.id as string, req.empresaId!, req.body)
  return ApiResponse.success(res, item, WORKSHOP_MESSAGES.workshopBranch.updated)
}

export const toggleActive = async (req: Request, res: Response) => {
  const item = await toggleBranchActive(prisma, req.params.id as string, req.empresaId!)
  const message = item.isActive ? WORKSHOP_MESSAGES.workshopBranch.activated : WORKSHOP_MESSAGES.workshopBranch.deactivated
  return ApiResponse.success(res, item, message)
}
