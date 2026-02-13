// backend/src/features/inventory/items/catalogs/units/units.controller.ts

import { Request, Response } from 'express'
import { UnitService } from './units.service'
import {
  CreateUnitDTO,
  UpdateUnitDTO,
  UnitResponseDTO,
  UnitGroupedDTO,
} from './units.dto'
import { ApiResponse } from '../../../../../shared/utils/ApiResponse'
import { asyncHandler } from '../../../../../shared/middleware/asyncHandler.middleware'
import { INVENTORY_MESSAGES } from '../../../shared/constants/messages'

const unitService = new UnitService()

export class UnitController {
  /**
   * GET /api/inventory/catalogs/units
   * Obtener todas las unidades
   */
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, search, type, isActive } = req.query

    const filters: any = {}
    if (search) filters.search = search as string
    if (type) filters.type = type as any
    if (isActive !== undefined)
      filters.isActive =
        isActive === 'true' ? true : isActive === 'false' ? false : undefined

    const result = await unitService.findAll(
      filters,
      Number(page) || 1,
      Number(limit) || 10
    )

    const units = result.units.map((unit) => new UnitResponseDTO(unit))

    return ApiResponse.paginated(
      res,
      units,
      result.page,
      result.limit,
      result.total,
      'Unidades obtenidas exitosamente'
    )
  })

  /**
   * GET /api/inventory/catalogs/units/active
   * Obtener unidades activas
   */
  getActive = asyncHandler(async (req: Request, res: Response) => {
    const units = await unitService.findActive()
    const response = units.map((unit) => new UnitResponseDTO(unit))

    return ApiResponse.success(
      res,
      response,
      'Unidades activas obtenidas exitosamente'
    )
  })

  /**
   * GET /api/inventory/catalogs/units/grouped
   * Obtener unidades agrupadas por tipo
   */
  getGroupedByType = asyncHandler(async (req: Request, res: Response) => {
    const grouped = await unitService.findGroupedByType()
    const response = grouped.map((group) => new UnitGroupedDTO(group))

    return ApiResponse.success(
      res,
      response,
      'Unidades agrupadas obtenidas exitosamente'
    )
  })

  /**
   * GET /api/inventory/catalogs/units/search
   * Buscar unidades
   */
  search = asyncHandler(async (req: Request, res: Response) => {
    const { term, limit } = req.query

    if (!term) {
      return ApiResponse.badRequest(res, 'El término de búsqueda es requerido')
    }

    const units = await unitService.search(term as string, Number(limit) || 10)
    const response = units.map((unit) => new UnitResponseDTO(unit))

    return ApiResponse.success(res, response, 'Búsqueda completada')
  })

  /**
   * GET /api/inventory/catalogs/units/type/:type
   * Obtener unidades por tipo
   */
  getByType = asyncHandler(async (req: Request, res: Response) => {
    const { type } = req.params as { type: string }

    const validTypes = ['COUNTABLE', 'WEIGHT', 'VOLUME', 'LENGTH']
    if (!validTypes.includes(type)) {
      return ApiResponse.badRequest(
        res,
        'Tipo inválido. Debe ser: COUNTABLE, WEIGHT, VOLUME o LENGTH'
      )
    }

    const units = await unitService.findByType(type as any)
    const response = units.map((unit) => new UnitResponseDTO(unit))

    return ApiResponse.success(
      res,
      response,
      `Unidades de tipo ${type} obtenidas exitosamente`
    )
  })

  /**
   * GET /api/inventory/catalogs/units/:id
   * Obtener unidad por ID
   */
  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }

    const unit = await unitService.findById(id)
    const response = new UnitResponseDTO(unit)

    return ApiResponse.success(res, response, 'Unidad obtenida exitosamente')
  })

  /**
   * POST /api/inventory/catalogs/units
   * Crear nueva unidad
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const dto = new CreateUnitDTO(req.body)
    const userId = req.user?.userId

    const unit = await unitService.create(dto, userId)
    const response = new UnitResponseDTO(unit)

    return ApiResponse.created(res, response, INVENTORY_MESSAGES.unit.created)
  })

  /**
   * POST /api/inventory/catalogs/units/bulk
   * Importación masiva de unidades
   */
  bulkCreate = asyncHandler(async (req: Request, res: Response) => {
    const { units } = req.body
    const userId = req.user?.userId

    if (!units || !Array.isArray(units) || units.length === 0) {
      return ApiResponse.badRequest(
        res,
        'Debe proporcionar un array de unidades'
      )
    }

    const dtos = units.map((u) => new CreateUnitDTO(u))
    const result = await unitService.bulkCreate(dtos, userId)

    return ApiResponse.success(
      res,
      result,
      `Importación completada. Éxitos: ${result.success.length}, Errores: ${result.errors.length}`
    )
  })

  /**
   * PUT /api/inventory/catalogs/units/:id
   * Actualizar unidad
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const dto = new UpdateUnitDTO(req.body)
    const userId = req.user?.userId

    const unit = await unitService.update(id, dto, userId)
    const response = new UnitResponseDTO(unit)

    return ApiResponse.success(res, response, INVENTORY_MESSAGES.unit.updated)
  })

  /**
   * PATCH /api/inventory/catalogs/units/:id/toggle
   * Activar/Desactivar unidad
   */
  toggleActive = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const userId = req.user?.userId

    const unit = await unitService.toggleActive(id, userId)
    const response = new UnitResponseDTO(unit)

    const message = unit.isActive
      ? 'Unidad activada exitosamente'
      : 'Unidad desactivada exitosamente'

    return ApiResponse.success(res, response, message)
  })

  /**
   * DELETE /api/inventory/catalogs/units/:id
   * Eliminar unidad (soft delete)
   */
  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const userId = req.user?.userId

    await unitService.delete(id, userId)

    return ApiResponse.success(res, null, INVENTORY_MESSAGES.unit.deleted)
  })

  /**
   * DELETE /api/inventory/catalogs/units/:id/hard
   * Eliminar unidad permanentemente
   */
  hardDelete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const userId = req.user?.userId

    await unitService.hardDelete(id, userId)

    return ApiResponse.success(res, null, 'Unidad eliminada permanentemente')
  })
}

export default new UnitController()
