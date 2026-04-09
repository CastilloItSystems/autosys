// backend/src/features/workshop/workshopShifts/workshopShifts.controller.ts
import type { Request, Response } from 'express'
import prisma from '../../../services/prisma.service.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import {
  findAllShifts,
  findShiftById,
  createShift,
  updateShift,
  toggleShiftActive,
} from './workshopShifts.service.js'
import { WORKSHOP_MESSAGES } from '../shared/constants/messages.js'

export const getAll = async (req: Request, res: Response) => {
  const result = await findAllShifts(
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
  const item = await findShiftById(
    prisma,
    req.params.id as string,
    req.empresaId!
  )
  return ApiResponse.success(res, item)
}

export const create = async (req: Request, res: Response) => {
  const item = await createShift(prisma, req.empresaId!, {
    ...req.body,
    createdBy: (req as any).user?.userId ?? 'system',
  })
  return ApiResponse.created(res, item, WORKSHOP_MESSAGES.workshopShift.created)
}

export const update = async (req: Request, res: Response) => {
  const item = await updateShift(
    prisma,
    req.params.id as string,
    req.empresaId!,
    req.body
  )
  return ApiResponse.success(res, item, WORKSHOP_MESSAGES.workshopShift.updated)
}

export const toggleActive = async (req: Request, res: Response) => {
  const item = await toggleShiftActive(
    prisma,
    req.params.id as string,
    req.empresaId!
  )
  const message = item.isActive
    ? WORKSHOP_MESSAGES.workshopShift.activated
    : WORKSHOP_MESSAGES.workshopShift.deactivated
  return ApiResponse.success(res, item, message)
}
