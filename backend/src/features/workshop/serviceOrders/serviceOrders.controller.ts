// backend/src/features/workshop/serviceOrders/serviceOrders.controller.ts
import type { Request, Response } from 'express'
import prisma from '../../../services/prisma.service.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import {
  createServiceOrder,
  findAllServiceOrders,
  findServiceOrderById,
  updateServiceOrder,
  updateServiceOrderStatus,
  deleteServiceOrder,
} from './serviceOrders.service.js'
import {
  CreateServiceOrderDTO,
  UpdateServiceOrderDTO,
  UpdateStatusDTO,
  ServiceOrderResponseDTO,
} from './serviceOrders.dto.js'

export const getAll = async (req: Request, res: Response) => {
  const empresaId = req.empresaId!
  const result = await findAllServiceOrders(prisma, empresaId, req.query as any)
  return ApiResponse.success(res, {
    ...result,
    data: result.data.map((o) => new ServiceOrderResponseDTO(o)),
  })
}

export const getOne = async (req: Request, res: Response) => {
  const empresaId = req.empresaId!
  const order = await findServiceOrderById(prisma, req.params.id as string, empresaId)
  return ApiResponse.success(res, new ServiceOrderResponseDTO(order))
}

export const create = async (req: Request, res: Response) => {
  const empresaId = req.empresaId!
  const userId = (req as any).user?.id as string
  const dto = new CreateServiceOrderDTO(req.body)
  const order = await createServiceOrder(prisma, empresaId, userId, dto)
  return ApiResponse.created(res, new ServiceOrderResponseDTO(order))
}

export const update = async (req: Request, res: Response) => {
  const empresaId = req.empresaId!
  const dto = new UpdateServiceOrderDTO(req.body)
  const order = await updateServiceOrder(prisma, req.params.id as string, empresaId, dto)
  return ApiResponse.success(res, new ServiceOrderResponseDTO(order))
}

export const updateStatus = async (req: Request, res: Response) => {
  const empresaId = req.empresaId!
  const dto = new UpdateStatusDTO(req.body)
  const order = await updateServiceOrderStatus(prisma, req.params.id as string, empresaId, dto)
  return ApiResponse.success(res, new ServiceOrderResponseDTO(order))
}

export const remove = async (req: Request, res: Response) => {
  const empresaId = req.empresaId!
  await deleteServiceOrder(prisma, req.params.id as string, empresaId)
  return ApiResponse.success(res, null, 'Orden eliminada')
}
