// backend/src/features/workshop/workshopBranches/workshopBranches.controller.ts
import type { Request, Response } from 'express'
import prisma from '../../../services/prisma.service.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import {
  findAllBranches,
  findBranchById,
  createBranch,
  updateBranch,
  toggleBranchActive,
} from './workshopBranches.service.js'

export const getAll = async (req: Request, res: Response) => {
  const result = await findAllBranches(prisma, req.empresaId!, req.validatedQuery as any)
  return ApiResponse.success(res, result)
}

export const getOne = async (req: Request, res: Response) => {
  const item = await findBranchById(prisma, req.params.id as string, req.empresaId!)
  return ApiResponse.success(res, item)
}

export const create = async (req: Request, res: Response) => {
  const item = await createBranch(prisma, req.empresaId!, { ...req.body, createdBy: (req as any).user?.id ?? 'system' })
  return ApiResponse.created(res, item, 'Sucursal creada')
}

export const update = async (req: Request, res: Response) => {
  const item = await updateBranch(prisma, req.params.id as string, req.empresaId!, req.body)
  return ApiResponse.success(res, item, 'Sucursal actualizada')
}

export const toggleActive = async (req: Request, res: Response) => {
  const item = await toggleBranchActive(prisma, req.params.id as string, req.empresaId!)
  return ApiResponse.success(res, item, `Sucursal ${item.isActive ? 'activada' : 'desactivada'}`)
}
