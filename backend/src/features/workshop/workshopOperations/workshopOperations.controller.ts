// backend/src/features/workshop/workshopOperations/workshopOperations.controller.ts
import type { Request, Response } from 'express'
import prisma from '../../../services/prisma.service.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import {
  findAllWorkshopOperations, findWorkshopOperationById, createWorkshopOperation,
  updateWorkshopOperation, toggleWorkshopOperationActive, deleteWorkshopOperation,
} from './workshopOperations.service.js'
import { CreateWorkshopOperationDTO, UpdateWorkshopOperationDTO, WorkshopOperationResponseDTO } from './workshopOperations.dto.js'

export const getAll = async (req: Request, res: Response) => {
  const result = await findAllWorkshopOperations(prisma, req.empresaId!, req.validatedQuery as any)
  return ApiResponse.success(res, { ...result, data: result.data.map(i => new WorkshopOperationResponseDTO(i)) })
}

export const getOne = async (req: Request, res: Response) => {
  const item = await findWorkshopOperationById(prisma, req.params.id as string, req.empresaId!)
  return ApiResponse.success(res, new WorkshopOperationResponseDTO(item))
}

export const create = async (req: Request, res: Response) => {
  const item = await createWorkshopOperation(prisma, req.empresaId!, new CreateWorkshopOperationDTO(req.body))
  return ApiResponse.created(res, new WorkshopOperationResponseDTO(item), 'Operación creada')
}

export const update = async (req: Request, res: Response) => {
  const item = await updateWorkshopOperation(prisma, req.params.id as string, req.empresaId!, new UpdateWorkshopOperationDTO(req.body))
  return ApiResponse.success(res, new WorkshopOperationResponseDTO(item), 'Operación actualizada')
}

export const toggleActive = async (req: Request, res: Response) => {
  const item = await toggleWorkshopOperationActive(prisma, req.params.id as string, req.empresaId!)
  return ApiResponse.success(res, new WorkshopOperationResponseDTO(item), `Operación ${item.isActive ? 'activada' : 'desactivada'}`)
}

export const remove = async (req: Request, res: Response) => {
  await deleteWorkshopOperation(prisma, req.params.id as string, req.empresaId!)
  return ApiResponse.success(res, null, 'Operación eliminada')
}
