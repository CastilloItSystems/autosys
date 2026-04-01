// backend/src/features/workshop/receptions/receptions.controller.ts
import type { Request, Response } from 'express'
import prisma from '../../../services/prisma.service.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import {
  findAllReceptions, findReceptionById, createReception, updateReception, deleteReception, changeReceptionStatus,
} from './receptions.service.js'
import { CreateReceptionDTO, UpdateReceptionDTO, ReceptionResponseDTO } from './receptions.dto.js'

export const getAll = async (req: Request, res: Response) => {
  const result = await findAllReceptions(prisma, req.empresaId!, req.validatedQuery as any)
  const items = result.data.map(i => new ReceptionResponseDTO(i))
  return ApiResponse.paginated(res, items, result.page, result.limit, result.total)
}

export const getOne = async (req: Request, res: Response) => {
  const item = await findReceptionById(prisma, req.params.id as string, req.empresaId!)
  return ApiResponse.success(res, new ReceptionResponseDTO(item))
}

export const create = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string
  const item = await createReception(prisma, req.empresaId!, userId, new CreateReceptionDTO(req.body))
  return ApiResponse.created(res, new ReceptionResponseDTO(item), 'Recepción registrada')
}

export const update = async (req: Request, res: Response) => {
  const item = await updateReception(prisma, req.params.id as string, req.empresaId!, new UpdateReceptionDTO(req.body))
  return ApiResponse.success(res, new ReceptionResponseDTO(item), 'Recepción actualizada')
}

export const remove = async (req: Request, res: Response) => {
  await deleteReception(prisma, req.params.id as string, req.empresaId!)
  return ApiResponse.success(res, null, 'Recepción eliminada')
}

export const changeStatus = async (req: Request, res: Response) => {
  const item = await changeReceptionStatus(prisma, req.params.id as string, req.empresaId!, req.body)
  return ApiResponse.success(res, new ReceptionResponseDTO(item), 'Estado de recepción actualizado')
}
