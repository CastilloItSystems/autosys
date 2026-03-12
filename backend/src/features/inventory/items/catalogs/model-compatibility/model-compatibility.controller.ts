// backend/src/features/inventory/items/catalogs/model-compatibility/model-compatibility.controller.ts

import { Request, Response } from 'express'
import { asyncHandler } from '../../../../../shared/middleware/asyncHandler.middleware.js'
import { ApiResponse } from '../../../../../shared/utils/apiResponse.js'
import { modelCompatibilityService } from './model-compatibility.service.js'
import {
  CreateCompatibilityDTO,
  UpdateCompatibilityDTO,
  CompatibilityResponseDTO,
} from './model-compatibility.dto.js'
import { ICompatibilityFilters } from './model-compatibility.interface.js'

function getEmpresaId(req: Request): string {
  if (!req.empresaId) throw new Error('empresaId not set by middleware')
  return req.empresaId
}

function getUserId(req: Request): string {
  return req.user?.userId ?? 'system'
}

const create = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const dto = new CreateCompatibilityDTO(req.body)
  const compatibility = await modelCompatibilityService.create(
    empresaId,
    dto,
    getUserId(req),
    req.prisma
  )
  return ApiResponse.created(
    res,
    new CompatibilityResponseDTO(compatibility),
    'Compatibilidad creada exitosamente'
  )
})

const getAll = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const {
    partModelId,
    vehicleModelId,
    isVerified,
    page = 1,
    limit = 10,
  } = req.query

  const filters: ICompatibilityFilters = {}
  if (partModelId) filters.partModelId = partModelId as string
  if (vehicleModelId) filters.vehicleModelId = vehicleModelId as string
  if (isVerified !== undefined) filters.isVerified = isVerified === 'true'

  const result = await modelCompatibilityService.findAll(
    empresaId,
    filters,
    Number(page),
    Number(limit),
    req.prisma
  )
  return ApiResponse.paginated(
    res,
    result.data.map((c) => new CompatibilityResponseDTO(c)),
    result.page,
    result.limit,
    result.total
  )
})

const getById = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const compatibility = await modelCompatibilityService.findById(
    empresaId,
    req.params.id as string,
    req.prisma
  )
  return ApiResponse.success(res, new CompatibilityResponseDTO(compatibility))
})

const getByPartModel = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const compatibilities = await modelCompatibilityService.findByPartModel(
    empresaId,
    req.params.partModelId as string,
    req.prisma
  )
  return ApiResponse.success(
    res,
    compatibilities.map((c) => new CompatibilityResponseDTO(c))
  )
})

const getByVehicleModel = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const compatibilities = await modelCompatibilityService.findByVehicleModel(
    empresaId,
    req.params.vehicleModelId as string,
    req.prisma
  )
  return ApiResponse.success(
    res,
    compatibilities.map((c) => new CompatibilityResponseDTO(c))
  )
})

const update = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const compatibility = await modelCompatibilityService.update(
    empresaId,
    req.params.id as string,
    new UpdateCompatibilityDTO(req.body),
    getUserId(req),
    req.prisma
  )
  return ApiResponse.success(
    res,
    new CompatibilityResponseDTO(compatibility),
    'Compatibilidad actualizada exitosamente'
  )
})

const verify = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const compatibility = await modelCompatibilityService.verify(
    empresaId,
    req.params.id as string,
    getUserId(req),
    req.prisma
  )
  return ApiResponse.success(
    res,
    new CompatibilityResponseDTO(compatibility),
    'Compatibilidad marcada como verificada'
  )
})

const deleteCompatibility = asyncHandler(
  async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    await modelCompatibilityService.delete(
      empresaId,
      req.params.id as string,
      getUserId(req),
      req.prisma
    )
    return ApiResponse.success(
      res,
      null,
      'Compatibilidad eliminada exitosamente'
    )
  }
)

export default {
  create,
  getAll,
  getById,
  getByPartModel,
  getByVehicleModel,
  update,
  verify,
  delete: deleteCompatibility,
}
