// backend/src/features/workshop/workshopWarranties/workshopWarranties.controller.ts
import type { Request, Response } from 'express'
import prisma from '../../../services/prisma.service.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import {
  findAllWarranties, findWarrantyById, createWarranty, updateWarranty, updateWarrantyStatus,
} from './workshopWarranties.service.js'
import { CreateWarrantyDTO, UpdateWarrantyDTO, WarrantyResponseDTO } from './workshopWarranties.dto.js'
import type { WarrantyStatus } from './workshopWarranties.interface.js'

export const getAll = async (req: Request, res: Response) => {
  const result = await findAllWarranties(prisma, req.empresaId!, req.validatedQuery as any)
  return ApiResponse.success(res, { ...result, data: result.data.map(i => new WarrantyResponseDTO(i)) })
}

export const getOne = async (req: Request, res: Response) => {
  const item = await findWarrantyById(prisma, req.params.id, req.empresaId!)
  return ApiResponse.success(res, new WarrantyResponseDTO(item))
}

export const create = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string
  const item = await createWarranty(prisma, req.empresaId!, userId, new CreateWarrantyDTO(req.body))
  return ApiResponse.created(res, new WarrantyResponseDTO(item), 'Garantía registrada')
}

export const update = async (req: Request, res: Response) => {
  const item = await updateWarranty(prisma, req.params.id, req.empresaId!, new UpdateWarrantyDTO(req.body))
  return ApiResponse.success(res, new WarrantyResponseDTO(item), 'Garantía actualizada')
}

export const updateStatus = async (req: Request, res: Response) => {
  const item = await updateWarrantyStatus(prisma, req.params.id, req.empresaId!, req.body.status as WarrantyStatus)
  return ApiResponse.success(res, new WarrantyResponseDTO(item), 'Estado de garantía actualizado')
}
