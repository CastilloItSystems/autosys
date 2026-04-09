// backend/src/features/workshop/deliveries/deliveries.controller.ts
import type { Request, Response } from 'express'
import prisma from '../../../services/prisma.service.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import * as deliveriesService from './deliveries.service.js'
import { CreateDeliveryDTO, DeliveryResponseDTO } from './deliveries.dto.js'
import type { IUpdateDeliveryInput } from './deliveries.interface.js'
import { WORKSHOP_MESSAGES } from '../shared/constants/messages.js'

export const getAll = async (req: Request, res: Response) => {
  const result = await deliveriesService.findAllDeliveries(
    prisma,
    req.empresaId!,
    req.validatedQuery as any
  )
  const items = result.data.map((i) => new DeliveryResponseDTO(i))
  const meta = PaginationHelper.getMeta(result.page, result.limit, result.total)
  return res.status(200).json({
    success: true,
    message: 'Datos obtenidos exitosamente',
    data: items,
    meta,
    timestamp: new Date().toISOString(),
  })
}

export const create = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId as string
  const dto = new CreateDeliveryDTO(req.body)
  const item = await deliveriesService.createDelivery(
    prisma,
    req.empresaId!,
    userId,
    dto
  )
  return ApiResponse.created(
    res,
    new DeliveryResponseDTO(item),
    WORKSHOP_MESSAGES.delivery.created
  )
}

export const getByOrder = async (req: Request, res: Response) => {
  const item = await deliveriesService.findDeliveryByServiceOrder(
    prisma,
    req.params.orderId as string,
    req.empresaId!
  )
  return ApiResponse.success(res, item ? new DeliveryResponseDTO(item) : {})
}

// FASE 1.2: Update delivery
export const update = async (req: Request, res: Response) => {
  const dto: IUpdateDeliveryInput = req.body
  const item = await deliveriesService.updateDelivery(
    prisma,
    req.params.id as string,
    req.empresaId!,
    dto
  )
  return ApiResponse.success(
    res,
    new DeliveryResponseDTO(item),
    WORKSHOP_MESSAGES.delivery.updated
  )
}

// FASE 1.3: Delete delivery
export const remove = async (req: Request, res: Response) => {
  await deliveriesService.deleteDelivery(
    prisma,
    req.params.id as string,
    req.empresaId!
  )
  return ApiResponse.success(res, {}, WORKSHOP_MESSAGES.delivery.deleted)
}
