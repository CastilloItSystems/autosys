// backend/src/features/workshop/workshopBays/workshopBays.controller.ts
import type { Request, Response } from 'express'
import prisma from '../../../services/prisma.service.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import {
  findAllWorkshopBays, findWorkshopBayById, createWorkshopBay,
  updateWorkshopBay, toggleWorkshopBayActive, deleteWorkshopBay,
} from './workshopBays.service.js'
import { CreateWorkshopBayDTO, UpdateWorkshopBayDTO, WorkshopBayResponseDTO } from './workshopBays.dto.js'

export const getAll = async (req: Request, res: Response) => {
  const result = await findAllWorkshopBays(prisma, req.empresaId!, req.validatedQuery as any)
  return ApiResponse.success(res, { ...result, data: result.data.map(i => new WorkshopBayResponseDTO(i)) })
}

export const getOne = async (req: Request, res: Response) => {
  const item = await findWorkshopBayById(prisma, req.params.id as string, req.empresaId!)
  return ApiResponse.success(res, new WorkshopBayResponseDTO(item))
}

export const create = async (req: Request, res: Response) => {
  const item = await createWorkshopBay(prisma, req.empresaId!, new CreateWorkshopBayDTO(req.body))
  return ApiResponse.created(res, new WorkshopBayResponseDTO(item), 'Bahía creada')
}

export const update = async (req: Request, res: Response) => {
  const item = await updateWorkshopBay(prisma, req.params.id as string, req.empresaId!, new UpdateWorkshopBayDTO(req.body))
  return ApiResponse.success(res, new WorkshopBayResponseDTO(item), 'Bahía actualizada')
}

export const toggleActive = async (req: Request, res: Response) => {
  const item = await toggleWorkshopBayActive(prisma, req.params.id as string, req.empresaId!)
  return ApiResponse.success(res, new WorkshopBayResponseDTO(item), `Bahía ${item.isActive ? 'activada' : 'desactivada'}`)
}

export const remove = async (req: Request, res: Response) => {
  await deleteWorkshopBay(prisma, req.params.id as string, req.empresaId!)
  return ApiResponse.success(res, null, 'Bahía eliminada')
}
