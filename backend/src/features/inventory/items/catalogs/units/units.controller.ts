// backend/src/features/inventory/items/catalogs/units/units.controller.ts

import { Request, Response } from 'express'
import unitService from './units.service.js'
import {
  CreateUnitDTO,
  UpdateUnitDTO,
  UnitResponseDTO,
  UnitGroupedDTO,
} from './units.dto.js'
import { ApiResponse } from '../../../../../shared/utils/apiResponse.js'
import { asyncHandler } from '../../../../../shared/middleware/asyncHandler.middleware.js'
import { INVENTORY_MESSAGES } from '../../../shared/constants/messages.js'

const MSG = INVENTORY_MESSAGES.unit

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
  const { page, limit, search, type, isActive } = req.query

  const filters: { search?: string; type?: string; isActive?: boolean } = {}
  if (search) filters.search = search as string
  if (type) filters.type = type as string
  if (isActive === 'true') filters.isActive = true
  if (isActive === 'false') filters.isActive = false

  const result = await unitService.findAll(
    empresaId,
    filters as never,
    Number(page) || 1,
    Number(limit) || 10,
    req.prisma
  )

  return ApiResponse.paginated(
    res,
    result.units.map((u) => new UnitResponseDTO(u)),
    result.page,
    result.limit,
    result.total
  )
})

const getActive = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const units = await unitService.findActive(empresaId, req.prisma)
  return ApiResponse.success(
    res,
    units.map((u) => new UnitResponseDTO(u))
  )
})

const getGroupedByType = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const grouped = await unitService.findGroupedByType(empresaId, req.prisma)
  return ApiResponse.success(
    res,
    grouped.map((g) => new UnitGroupedDTO(g))
  )
})

const search = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const { term, limit } = req.query

  if (!term)
    return ApiResponse.badRequest(res, 'El término de búsqueda es requerido')

  const units = await unitService.search(
    empresaId,
    term as string,
    Number(limit) || 10,
    req.prisma
  )
  return ApiResponse.success(
    res,
    units.map((u) => new UnitResponseDTO(u))
  )
})

const getByType = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const type = req.params.type as string

  const validTypes = ['COUNTABLE', 'WEIGHT', 'VOLUME', 'LENGTH']
  if (!validTypes.includes(type)) {
    return ApiResponse.badRequest(
      res,
      'Tipo inválido. Debe ser: COUNTABLE, WEIGHT, VOLUME o LENGTH'
    )
  }

  const units = await unitService.findByType(
    empresaId,
    type as never,
    req.prisma
  )
  return ApiResponse.success(
    res,
    units.map((u) => new UnitResponseDTO(u))
  )
})

const getById = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const unit = await unitService.findById(
    empresaId,
    req.params.id as string,
    req.prisma
  )
  return ApiResponse.success(res, new UnitResponseDTO(unit))
})

// ---------------------------------------------------------------------------
// POST
// ---------------------------------------------------------------------------

const create = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const unit = await unitService.create(
    empresaId,
    new CreateUnitDTO(req.body) as never,
    getUserId(req),
    req.prisma
  )
  return ApiResponse.created(res, new UnitResponseDTO(unit), MSG.created)
})

const bulkCreate = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const { units } = req.body as { units: unknown[] }

  if (!Array.isArray(units) || units.length === 0) {
    return ApiResponse.badRequest(res, 'Debe proporcionar un array de unidades')
  }

  const result = await unitService.bulkCreate(
    empresaId,
    units.map((u) => new CreateUnitDTO(u) as never),
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
  const unit = await unitService.update(
    empresaId,
    req.params.id as string,
    new UpdateUnitDTO(req.body) as never,
    getUserId(req),
    req.prisma
  )
  return ApiResponse.success(res, new UnitResponseDTO(unit), MSG.updated)
})

const toggleActive = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const unit = await unitService.toggleActive(
    empresaId,
    req.params.id as string,
    getUserId(req),
    req.prisma
  )
  const message = unit.isActive
    ? 'Unidad activada exitosamente'
    : 'Unidad desactivada exitosamente'
  return ApiResponse.success(res, new UnitResponseDTO(unit), message)
})

// ---------------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------------

const deleteUnit = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  await unitService.delete(
    empresaId,
    req.params.id as string,
    getUserId(req),
    req.prisma
  )
  return ApiResponse.success(res, null, MSG.deleted)
})

const hardDelete = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  await unitService.hardDelete(
    empresaId,
    req.params.id as string,
    getUserId(req),
    req.prisma
  )
  return ApiResponse.success(res, null, 'Unidad eliminada permanentemente')
})

export default {
  getAll,
  getActive,
  getGroupedByType,
  search,
  getByType,
  getById,
  create,
  bulkCreate,
  update,
  toggleActive,
  delete: deleteUnit,
  hardDelete,
}
