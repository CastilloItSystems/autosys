// backend/src/features/inventory/warehouses/warehouses.controller.ts

import { Request, Response } from 'express'
import warehouseService from './warehouses.service.js'
import {
  CreateWarehouseDTO,
  UpdateWarehouseDTO,
  WarehouseResponseDTO,
} from './warehouses.dto.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { INVENTORY_MESSAGES } from '../shared/constants/messages.js'

function getEmpresaId(req: Request): string {
  if (!req.empresaId) throw new Error('empresaId not set by middleware')
  return req.empresaId
}

function getUserId(req: Request): string {
  return req.user?.userId ?? 'system'
}

const getAll = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const { page, limit, search, type, isActive, sortBy, sortOrder } = req.query

  const filters: Record<string, unknown> = {}
  if (search) filters.search = search as string
  if (type) filters.type = type as string
  if (isActive !== undefined) {
    filters.isActive =
      isActive === 'true' ? true : isActive === 'false' ? false : undefined
  }

  const result = await warehouseService.findAll(
    filters,
    Number(page) || 1,
    Number(limit) || 10,
    (sortBy as string) || 'name',
    (sortOrder as 'asc' | 'desc') || 'asc',
    empresaId,
    req.prisma
  )

  const warehouses = result.items.map(
    (w) => new WarehouseResponseDTO(w, { includeRelations: false })
  )

  return ApiResponse.paginated(
    res,
    warehouses,
    result.page,
    result.limit,
    result.total,
    INVENTORY_MESSAGES.warehouse.notFound
  )
})

const getActive = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const { limit } = req.query

  const warehouses = await warehouseService.findActive(
    empresaId,
    req.prisma,
    Number(limit) || 100
  )
  const response = warehouses.map(
    (w) => new WarehouseResponseDTO(w, { includeRelations: false })
  )

  return ApiResponse.paginated(
    res,
    response,
    1,
    response.length,
    response.length,
    'Almacenes activos obtenidos exitosamente'
  )
})

const search = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const { term, limit } = req.query

  if (!term) {
    return ApiResponse.badRequest(res, 'El término de búsqueda es requerido')
  }

  const warehouses = await warehouseService.search(
    term as string,
    empresaId,
    req.prisma,
    Number(limit) || 20
  )
  const response = warehouses.map(
    (w) => new WarehouseResponseDTO(w, { includeRelations: false })
  )

  return ApiResponse.paginated(
    res,
    response,
    1,
    response.length,
    response.length,
    'Búsqueda completada'
  )
})

const getOne = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const id = req.params.id as string

  const warehouse = await warehouseService.findById(id, empresaId, req.prisma)
  const response = new WarehouseResponseDTO(warehouse, {
    includeRelations: true,
  })

  return ApiResponse.success(res, response, 'Almacén obtenido exitosamente')
})

const create = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const userId = getUserId(req)
  const createDTO = new CreateWarehouseDTO(req.body)

  const warehouse = await warehouseService.create(
    createDTO,
    userId,
    empresaId,
    req.prisma
  )
  const response = new WarehouseResponseDTO(warehouse, {
    includeRelations: true,
  })

  return ApiResponse.created(
    res,
    response,
    INVENTORY_MESSAGES.warehouse.created
  )
})

const update = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const userId = getUserId(req)
  const id = req.params.id as string
  const updateDTO = new UpdateWarehouseDTO(req.body)

  const warehouse = await warehouseService.update(
    id,
    updateDTO,
    userId,
    empresaId,
    req.prisma
  )
  const response = new WarehouseResponseDTO(warehouse, {
    includeRelations: true,
  })

  return ApiResponse.success(
    res,
    response,
    INVENTORY_MESSAGES.warehouse.updated
  )
})

const deleteWarehouse = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const userId = getUserId(req)
  const id = req.params.id as string

  await warehouseService.delete(id, userId, empresaId, req.prisma)

  return ApiResponse.success(res, {}, INVENTORY_MESSAGES.warehouse.deleted)
})

const deactivate = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const userId = getUserId(req)
  const id = req.params.id as string

  const warehouse = await warehouseService.deactivate(
    id,
    userId,
    empresaId,
    req.prisma
  )
  const response = new WarehouseResponseDTO(warehouse, {
    includeRelations: true,
  })

  return ApiResponse.success(res, response, 'Almacén desactivado exitosamente')
})

const activate = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const userId = getUserId(req)
  const id = req.params.id as string

  const warehouse = await warehouseService.activate(
    id,
    userId,
    empresaId,
    req.prisma
  )
  const response = new WarehouseResponseDTO(warehouse, {
    includeRelations: true,
  })

  return ApiResponse.success(res, response, 'Almacén activado exitosamente')
})

export default {
  getAll,
  getActive,
  search,
  getOne,
  create,
  update,
  delete: deleteWarehouse,
  deactivate,
  activate,
}
