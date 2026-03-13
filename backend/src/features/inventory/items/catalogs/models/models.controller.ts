// backend/src/features/inventory/items/catalogs/models/models.controller.ts

import { Request, Response } from 'express'
import modelService from './models.service.js'
import {
  CreateModelDTO,
  UpdateModelDTO,
  ModelResponseDTO,
  ModelGroupedDTO,
} from './models.dto.js'
import { IModelFilters, ModelType } from './models.interface.js'
import { ApiResponse } from '../../../../../shared/utils/apiResponse.js'
import { asyncHandler } from '../../../../../shared/middleware/asyncHandler.middleware.js'
import { INVENTORY_MESSAGES } from '../../../shared/constants/messages.js'

const MSG = INVENTORY_MESSAGES.model

function getEmpresaId(req: Request): string {
  if (!req.empresaId) throw new Error('empresaId not set by middleware')
  return req.empresaId
}

function getUserId(req: Request): string {
  return req.user?.userId ?? 'system'
}

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------

const getAll = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const { page, limit, search, brandId, year, type, isActive } = req.query

  const filters: IModelFilters = {}
  if (search) filters.search = search as string
  if (brandId) filters.brandId = brandId as string
  if (year) filters.year = Number(year)
  if (type) filters.type = type as ModelType
  if (isActive === 'true') filters.isActive = true
  if (isActive === 'false') filters.isActive = false

  const result = await modelService.findAll(
    empresaId,
    filters,
    Number(page) || 1,
    Number(limit) || 10,
    req.prisma
  )
  return ApiResponse.paginated(
    res,
    result.models.map((m) => new ModelResponseDTO(m, { includeBrand: true })),
    result.page,
    result.limit,
    result.total
  )
})

const getActive = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const { type } = req.query
  const models = await modelService.findActive(
    empresaId,
    req.prisma,
    type as 'VEHICLE' | 'PART' | undefined
  )
  return ApiResponse.success(
    res,
    models.map((m) => new ModelResponseDTO(m, { includeBrand: true }))
  )
})

const getGroupedByBrand = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const grouped = await modelService.findGroupedByBrand(empresaId, req.prisma)
  return ApiResponse.success(
    res,
    grouped.map((g) => new ModelGroupedDTO(g))
  )
})

const getAvailableYears = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const years = await modelService.getAvailableYears(empresaId, req.prisma)
  return ApiResponse.success(res, years)
})

const search = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const { term, limit } = req.query

  if (!term)
    return ApiResponse.badRequest(res, 'El término de búsqueda es requerido')

  const models = await modelService.search(
    empresaId,
    term as string,
    req.prisma,
    Number(limit) || 10
  )
  return ApiResponse.success(
    res,
    models.map((m) => new ModelResponseDTO(m, { includeBrand: true }))
  )
})

const getByBrand = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const models = await modelService.findByBrand(
    empresaId,
    req.params.brandId as string,
    req.prisma
  )
  return ApiResponse.success(
    res,
    models.map((m) => new ModelResponseDTO(m, { includeBrand: true }))
  )
})

const getByYear = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const year = Number(req.params.year)
  const models = await modelService.findByYear(empresaId, year, req.prisma)
  return ApiResponse.success(
    res,
    models.map((m) => new ModelResponseDTO(m, { includeBrand: true }))
  )
})

const getById = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const model = await modelService.findById(
    empresaId,
    req.params.id as string,
    req.prisma
  )
  return ApiResponse.success(
    res,
    new ModelResponseDTO(model, { includeBrand: true })
  )
})

// ---------------------------------------------------------------------------
// POST
// ---------------------------------------------------------------------------

const create = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const model = await modelService.create(
    empresaId,
    new CreateModelDTO(req.body) as never,
    getUserId(req),
    req.prisma
  )
  return ApiResponse.created(
    res,
    new ModelResponseDTO(model, { includeBrand: true }),
    MSG.created
  )
})

const bulkCreate = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const { models } = req.body

  if (!models || !Array.isArray(models) || models.length === 0) {
    return ApiResponse.badRequest(res, 'Debe proporcionar un array de modelos')
  }

  const result = await modelService.bulkCreate(
    empresaId,
    models.map((m: unknown) => new CreateModelDTO(m) as never),
    getUserId(req),
    req.prisma
  )
  return ApiResponse.success(
    res,
    result,
    `Importación completada. Éxitos: ${result.success.length}, Errores: ${result.errors.length}`
  )
})

// ---------------------------------------------------------------------------
// PUT / PATCH
// ---------------------------------------------------------------------------

const update = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const model = await modelService.update(
    empresaId,
    req.params.id as string,
    new UpdateModelDTO(req.body) as never,
    getUserId(req),
    req.prisma
  )
  return ApiResponse.success(
    res,
    new ModelResponseDTO(model, { includeBrand: true }),
    MSG.updated
  )
})

const toggleActive = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const model = await modelService.toggleActive(
    empresaId,
    req.params.id as string,
    getUserId(req),
    req.prisma
  )
  const message = model.isActive
    ? 'Modelo activado exitosamente'
    : 'Modelo desactivado exitosamente'
  return ApiResponse.success(
    res,
    new ModelResponseDTO(model, { includeBrand: true }),
    message
  )
})

// ---------------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------------

const deleteModel = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  await modelService.delete(
    empresaId,
    req.params.id as string,
    getUserId(req),
    req.prisma
  )
  return ApiResponse.success(res, null, MSG.deleted)
})

const hardDelete = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  await modelService.hardDelete(
    empresaId,
    req.params.id as string,
    getUserId(req),
    req.prisma
  )
  return ApiResponse.success(res, null, 'Modelo eliminado permanentemente')
})

export default {
  getAll,
  getActive,
  getGroupedByBrand,
  getAvailableYears,
  search,
  getByBrand,
  getByYear,
  getById,
  create,
  bulkCreate,
  update,
  toggleActive,
  delete: deleteModel,
  hardDelete,
}
