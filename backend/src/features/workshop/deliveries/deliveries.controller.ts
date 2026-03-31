// backend/src/features/workshop/deliveries/deliveries.controller.ts
import type { Request, Response } from 'express'
import prisma from '../../../services/prisma.service.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import * as deliveriesService from './deliveries.service.js'
import { CreateDeliveryDTO, DeliveryResponseDTO } from './deliveries.dto.js'

export const create = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string
  const dto = new CreateDeliveryDTO(req.body)
  const item = await deliveriesService.createDelivery(prisma, req.empresaId!, userId, dto)
  return ApiResponse.created(res, new DeliveryResponseDTO(item), 'Entrega registrada correctamente')
}

export const getByOrder = async (req: Request, res: Response) => {
  const item = await deliveriesService.findDeliveryByServiceOrder(prisma, req.params.orderId as string, req.empresaId!)
  return ApiResponse.success(res, item ? new DeliveryResponseDTO(item) : {})
}
