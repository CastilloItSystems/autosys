// backend/src/features/workshop/workshopGarita/workshopGarita.controller.ts
import type { Request, Response } from 'express'
import prisma from '../../../services/prisma.service.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import {
  findAllGaritaEvents,
  findGaritaEventById,
  createGaritaEvent,
  updateGaritaEvent,
  updateGaritaStatus,
  removeGaritaEvent,
} from './workshopGarita.service.js'
import {
  CreateGaritaEventDTO,
  UpdateGaritaEventDTO,
  GaritaEventResponseDTO,
} from './workshopGarita.dto.js'
import type {
  GaritaEventStatus,
  IGaritaFilters,
} from './workshopGarita.interface.js'

export const getAll = async (req: Request, res: Response) => {
  const result = await findAllGaritaEvents(
    prisma,
    req.empresaId!,
    req.validatedQuery as IGaritaFilters
  )
  const items = result.data.map((i) => new GaritaEventResponseDTO(i))
  return ApiResponse.paginated(
    res,
    items,
    result.page,
    result.limit,
    result.total
  )
}

export const getOne = async (req: Request, res: Response) => {
  const item = await findGaritaEventById(
    prisma,
    req.params.id as string,
    req.empresaId!
  )
  return ApiResponse.success(res, new GaritaEventResponseDTO(item))
}

export const create = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId as string
  const item = await createGaritaEvent(
    prisma,
    req.empresaId!,
    userId,
    new CreateGaritaEventDTO(req.body)
  )
  return ApiResponse.created(
    res,
    new GaritaEventResponseDTO(item),
    'Registro de garita creado'
  )
}

export const update = async (req: Request, res: Response) => {
  const item = await updateGaritaEvent(
    prisma,
    req.params.id as string,
    req.empresaId!,
    new UpdateGaritaEventDTO(req.body)
  )
  return ApiResponse.success(
    res,
    new GaritaEventResponseDTO(item),
    'Registro de garita actualizado'
  )
}

export const updateStatus = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId as string
  const { status, kmOut, exitPassRef, irregularityNotes, notes } = req.body
  const item = await updateGaritaStatus(
    prisma,
    req.params.id as string,
    req.empresaId!,
    userId,
    status as GaritaEventStatus,
    { kmOut, exitPassRef, irregularityNotes, notes }
  )
  return ApiResponse.success(
    res,
    new GaritaEventResponseDTO(item),
    'Estado actualizado'
  )
}

export const remove = async (req: Request, res: Response) => {
  await removeGaritaEvent(prisma, req.params.id as string, req.empresaId!)
  return ApiResponse.success(res, null, 'Registro de garita eliminado')
}
