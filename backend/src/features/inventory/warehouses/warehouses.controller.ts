// backend/src/features/inventory/warehouses/warehouses.controller.ts

import { Request, Response } from 'express'
import { WarehouseService } from './warehouses.service'
import {
  CreateWarehouseDTO,
  UpdateWarehouseDTO,
  WarehouseResponseDTO,
} from './warehouses.dto'
import { ApiResponse } from '../../../shared/utils/apiResponse'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware'
import { INVENTORY_MESSAGES } from '../shared/constants/messages'

const warehouseService = new WarehouseService()

export class WarehouseController {
  /**
   * GET /api/inventory/warehouses
   * Obtener todos los almacenes con filtros
   */
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, search, type, isActive, sortBy, sortOrder } = req.query

    const filters: any = {}
    if (search) filters.search = search as string
    if (type) filters.type = type as string
    if (isActive !== undefined)
      filters.isActive =
        isActive === 'true' ? true : isActive === 'false' ? false : undefined

    const result = await warehouseService.findAll(
      filters,
      Number(page) || 1,
      Number(limit) || 10,
      (sortBy as string) || 'name',
      (sortOrder as 'asc' | 'desc') || 'asc',
      req.prisma || undefined
    )

    const warehouses = result.items.map(
      (warehouse: any) =>
        new WarehouseResponseDTO(warehouse, {
          includeRelations: true,
        })
    )

    return ApiResponse.paginated(
      res,
      warehouses,
      result.page,
      result.limit,
      result.total,
      'Almacenes obtenidos exitosamente'
    )
  })

  /**
   * GET /api/inventory/warehouses/active
   * Obtener almacenes activos
   */
  getActive = asyncHandler(async (req: Request, res: Response) => {
    const { limit } = req.query

    const warehouses = await warehouseService.findActive(Number(limit) || 100)
    const response = warehouses.map(
      (warehouse) =>
        new WarehouseResponseDTO(warehouse, {
          includeRelations: false,
        })
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

  /**
   * GET /api/inventory/warehouses/search
   * Buscar almacenes
   */
  search = asyncHandler(async (req: Request, res: Response) => {
    const { term, limit } = req.query

    if (!term) {
      return ApiResponse.badRequest(res, 'El término de búsqueda es requerido')
    }

    const warehouses = await warehouseService.search(
      term as string,
      Number(limit) || 20
    )
    const response = warehouses.map(
      (warehouse) =>
        new WarehouseResponseDTO(warehouse, {
          includeRelations: false,
        })
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

  /**
   * GET /api/inventory/warehouses/:id
   * Obtener almacén por ID
   */
  getOne = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }

    const warehouse = await warehouseService.findById(id)
    const response = new WarehouseResponseDTO(warehouse, {
      includeRelations: true,
    })

    return ApiResponse.success(res, response, 'Almacén obtenido exitosamente')
  })

  /**
   * POST /api/inventory/warehouses
   * Crear un nuevo almacén
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const createDTO = new CreateWarehouseDTO(req.body)
    const userId = req.user?.userId

    const warehouse = await warehouseService.create(createDTO, userId)
    const response = new WarehouseResponseDTO(warehouse, {
      includeRelations: true,
    })

    return ApiResponse.created(res, response, 'Almacén creado exitosamente')
  })

  /**
   * PUT /api/inventory/warehouses/:id
   * Actualizar almacén
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const updateDTO = new UpdateWarehouseDTO(req.body)
    const userId = req.user?.userId

    const warehouse = await warehouseService.update(id, updateDTO, userId)
    const response = new WarehouseResponseDTO(warehouse, {
      includeRelations: true,
    })

    return ApiResponse.success(
      res,
      response,
      'Almacén actualizado exitosamente'
    )
  })

  /**
   * DELETE /api/inventory/warehouses/:id
   * Eliminar almacén
   */
  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const userId = req.user?.userId

    await warehouseService.delete(id, userId)

    return ApiResponse.success(res, {}, 'Almacén eliminado exitosamente')
  })

  /**
   * PATCH /api/inventory/warehouses/:id/deactivate
   * Desactivar almacén
   */
  deactivate = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const userId = req.user?.userId

    const warehouse = await warehouseService.deactivate(id, userId)
    const response = new WarehouseResponseDTO(warehouse, {
      includeRelations: true,
    })

    return ApiResponse.success(
      res,
      response,
      'Almacén desactivado exitosamente'
    )
  })

  /**
   * PATCH /api/inventory/warehouses/:id/activate
   * Activar almacén
   */
  activate = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const userId = req.user?.userId

    const warehouse = await warehouseService.activate(id, userId)
    const response = new WarehouseResponseDTO(warehouse, {
      includeRelations: true,
    })

    return ApiResponse.success(res, response, 'Almacén activado exitosamente')
  })
}

export default new WarehouseController()
