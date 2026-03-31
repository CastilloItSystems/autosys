// backend/src/features/workshop/serviceTypes/serviceTypes.controller.ts
import type { Request, Response } from 'express'
import prisma from '../../../services/prisma.service.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import {
  findAllServiceTypes,
  findServiceTypeById,
  createServiceType,
  updateServiceType,
  toggleServiceTypeActive,
  deleteServiceType,
} from './serviceTypes.service.js'
import { CreateServiceTypeDTO, UpdateServiceTypeDTO, ServiceTypeResponseDTO } from './serviceTypes.dto.js'

export const getAll = async (req: Request, res: Response) => {
  const result = await findAllServiceTypes(prisma, req.empresaId!, req.validatedQuery as any)
  return ApiResponse.success(res, { ...result, data: result.data.map(i => new ServiceTypeResponseDTO(i)) })
}

export const getOne = async (req: Request, res: Response) => {
  const item = await findServiceTypeById(prisma, req.params.id as string, req.empresaId!)
  return ApiResponse.success(res, new ServiceTypeResponseDTO(item))
}

export const create = async (req: Request, res: Response) => {
  const item = await createServiceType(prisma, req.empresaId!, new CreateServiceTypeDTO(req.body))
  return ApiResponse.created(res, new ServiceTypeResponseDTO(item), 'Tipo de servicio creado')
}

export const update = async (req: Request, res: Response) => {
  const item = await updateServiceType(prisma, req.params.id as string, req.empresaId!, new UpdateServiceTypeDTO(req.body))
  return ApiResponse.success(res, new ServiceTypeResponseDTO(item), 'Tipo de servicio actualizado')
}

export const toggleActive = async (req: Request, res: Response) => {
  const item = await toggleServiceTypeActive(prisma, req.params.id as string, req.empresaId!)
  return ApiResponse.success(res, new ServiceTypeResponseDTO(item), `Tipo de servicio ${item.isActive ? 'activado' : 'desactivado'}`)
}

export const remove = async (req: Request, res: Response) => {
  await deleteServiceType(prisma, req.params.id as string, req.empresaId!)
  return ApiResponse.success(res, null, 'Tipo de servicio eliminado')
}
