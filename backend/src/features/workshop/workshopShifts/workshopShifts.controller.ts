// backend/src/features/workshop/workshopShifts/workshopShifts.controller.ts
import type { Request, Response } from 'express'
import prisma from '../../../services/prisma.service.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import {
  findAllShifts,
  findShiftById,
  createShift,
  updateShift,
  toggleShiftActive,
} from './workshopShifts.service.js'

export const getAll = async (req: Request, res: Response) => {
  const result = await findAllShifts(prisma, req.empresaId!, req.validatedQuery as any)
  return ApiResponse.success(res, result)
}

export const getOne = async (req: Request, res: Response) => {
  const item = await findShiftById(prisma, req.params.id as string, req.empresaId!)
  return ApiResponse.success(res, item)
}

export const create = async (req: Request, res: Response) => {
  const item = await createShift(prisma, req.empresaId!, { ...req.body, createdBy: (req as any).user?.id ?? 'system' })
  return ApiResponse.created(res, item, 'Turno creado')
}

export const update = async (req: Request, res: Response) => {
  const item = await updateShift(prisma, req.params.id as string, req.empresaId!, req.body)
  return ApiResponse.success(res, item, 'Turno actualizado')
}

export const toggleActive = async (req: Request, res: Response) => {
  const item = await toggleShiftActive(prisma, req.params.id as string, req.empresaId!)
  return ApiResponse.success(res, item, `Turno ${item.isActive ? 'activado' : 'desactivado'}`)
}
