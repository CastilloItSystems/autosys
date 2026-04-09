// backend/src/features/workshop/laborTimes/laborTimes.controller.ts
import type { Request, Response } from 'express'
import prisma from '../../../services/prisma.service.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import {
  findAllLaborTimes,
  findLaborTimeById,
  startLaborTime,
  pauseLaborTime,
  resumeLaborTime,
  finishLaborTime,
  cancelLaborTime,
} from './laborTimes.service.js'
import { StartLaborTimeDTO, LaborTimeResponseDTO } from './laborTimes.dto.js'

export const getAll = async (req: Request, res: Response) => {
  const result = await findAllLaborTimes(
    prisma,
    req.empresaId!,
    req.validatedQuery as any
  )
  const items = result.data.map((i) => new LaborTimeResponseDTO(i))
  return ApiResponse.paginated(
    res,
    items,
    result.page,
    result.limit,
    result.total
  )
}

export const getOne = async (req: Request, res: Response) => {
  const item = await findLaborTimeById(
    prisma,
    req.params.id as string,
    req.empresaId!
  )
  return ApiResponse.success(res, new LaborTimeResponseDTO(item))
}

export const start = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId as string
  const item = await startLaborTime(
    prisma,
    req.empresaId!,
    userId,
    new StartLaborTimeDTO(req.body)
  )
  return ApiResponse.created(
    res,
    new LaborTimeResponseDTO(item),
    'Tiempo iniciado'
  )
}

export const pause = async (req: Request, res: Response) => {
  const item = await pauseLaborTime(
    prisma,
    req.params.id as string,
    req.empresaId!,
    req.body?.reason
  )
  return ApiResponse.success(
    res,
    new LaborTimeResponseDTO(item),
    'Trabajo pausado'
  )
}

export const resume = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId as string
  const item = await resumeLaborTime(
    prisma,
    req.params.id as string,
    req.empresaId!,
    userId
  )
  return ApiResponse.success(
    res,
    new LaborTimeResponseDTO(item),
    'Trabajo reanudado'
  )
}

export const finish = async (req: Request, res: Response) => {
  const item = await finishLaborTime(
    prisma,
    req.params.id as string,
    req.empresaId!,
    req.body?.notes
  )
  return ApiResponse.success(
    res,
    new LaborTimeResponseDTO(item),
    'Trabajo finalizado'
  )
}

export const cancel = async (req: Request, res: Response) => {
  const item = await cancelLaborTime(
    prisma,
    req.params.id as string,
    req.empresaId!
  )
  return ApiResponse.success(
    res,
    new LaborTimeResponseDTO(item),
    'Registro cancelado'
  )
}
