// backend/src/features/inventory/suppliers/suppliers.controller.ts

import { Request, Response } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware'
import { ApiResponse } from '../../../shared/utils/ApiResponse'
import SupplierService from './suppliers.service'
import {
  CreateSupplierDTO,
  UpdateSupplierDTO,
  SupplierResponseDTO,
} from './suppliers.dto'
import { ISupplierFilters } from './suppliers.interface'

export class SupplierController {
  /**
   * GET /api/inventory/suppliers
   * Obtener todos los proveedores con paginación
   */
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 20,
      code,
      name,
      isActive,
      sortBy = 'name',
      sortOrder = 'asc',
    } = req.query

    const filters: ISupplierFilters = {}
    if (code) filters.code = code as string
    if (name) filters.name = name as string
    if (isActive !== undefined) filters.isActive = isActive === 'true'

    const result = await SupplierService.findAll(
      filters,
      Number(page),
      Number(limit),
      sortBy as string,
      (sortOrder as string).toLowerCase() as 'asc' | 'desc',
      req.prisma || undefined
    )

    const items = result.items.map(
      (supplier) => new SupplierResponseDTO(supplier)
    )

    return ApiResponse.paginated(
      res,
      items,
      Number(page),
      Number(limit),
      result.total
    )
  })

  /**
   * GET /api/inventory/suppliers/:id
   * Obtener un proveedor por ID
   */
  getOne = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const supplier = await SupplierService.findById(id)
    const dto = new SupplierResponseDTO(supplier)
    return ApiResponse.success(res, dto)
  })

  /**
   * GET /api/inventory/suppliers/code/:code
   * Obtener un proveedor por código
   */
  getByCode = asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.params
    const supplier = await SupplierService.findByCode(code)
    const dto = new SupplierResponseDTO(supplier)
    return ApiResponse.success(res, dto)
  })

  /**
   * GET /api/inventory/suppliers/active
   * Obtener solo proveedores activos
   */
  getActive = asyncHandler(async (req: Request, res: Response) => {
    const { limit = 20 } = req.query
    const suppliers = await SupplierService.findActive(Number(limit))
    const dtos = suppliers.map((supplier) => new SupplierResponseDTO(supplier))
    return ApiResponse.success(res, dtos)
  })

  /**
   * POST /api/inventory/suppliers
   * Crear nuevo proveedor
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const createDTO = new CreateSupplierDTO(req.body)
    const supplier = await SupplierService.create(createDTO)
    const dto = new SupplierResponseDTO(supplier)
    return ApiResponse.created(res, dto)
  })

  /**
   * PUT /api/inventory/suppliers/:id
   * Actualizar proveedor
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const updateDTO = new UpdateSupplierDTO(req.body)
    const supplier = await SupplierService.update(id, updateDTO)
    const dto = new SupplierResponseDTO(supplier)
    return ApiResponse.success(res, dto)
  })

  /**
   * DELETE /api/inventory/suppliers/:id
   * Eliminar proveedor
   */
  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const result = await SupplierService.delete(id)
    return ApiResponse.success(res, result)
  })

  /**
   * PATCH /api/inventory/suppliers/:id/toggle
   * Cambiar estado activo/inactivo
   */
  toggleActive = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const supplier = await SupplierService.toggleActive(id)
    const dto = new SupplierResponseDTO(supplier)
    return ApiResponse.success(res, dto)
  })
}
