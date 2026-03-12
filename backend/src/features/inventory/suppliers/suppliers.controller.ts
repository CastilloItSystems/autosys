// backend/src/features/inventory/suppliers/suppliers.controller.ts

import { Request, Response } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import supplierService from './suppliers.service.js'
import {
  CreateSupplierDTO,
  UpdateSupplierDTO,
  SupplierResponseDTO,
} from './suppliers.dto.js'
import { INVENTORY_MESSAGES } from '../shared/constants/messages.js'

const MSG = INVENTORY_MESSAGES.supplier

function getEmpresaId(req: Request): string {
  if (!req.empresaId) throw new Error('empresaId not set by middleware')
  return req.empresaId
}

function getUserId(req: Request): string {
  return req.user?.userId ?? 'system'
}

const getAll = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const {
    page = 1,
    limit = 20,
    code,
    name,
    isActive,
    sortBy = 'name',
    sortOrder = 'asc',
  } = req.query

  const filters: { code?: string; name?: string; isActive?: boolean } = {}
  if (code) filters.code = code as string
  if (name) filters.name = name as string
  if (isActive !== undefined) filters.isActive = isActive === 'true'

  const result = await supplierService.findAll(
    filters,
    Number(page),
    Number(limit),
    sortBy as string,
    (sortOrder as string).toLowerCase() as 'asc' | 'desc',
    empresaId,
    req.prisma
  )

  const items = result.items.map((s) => new SupplierResponseDTO(s))

  return ApiResponse.paginated(
    res,
    items,
    result.page,
    result.limit,
    result.total
  )
})

const getOne = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const id = req.params.id as string

  const supplier = await supplierService.findById(id, empresaId, req.prisma)
  return ApiResponse.success(res, new SupplierResponseDTO(supplier))
})

const getByCode = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const code = req.params.code as string

  const supplier = await supplierService.findByCode(code, empresaId, req.prisma)
  return ApiResponse.success(res, new SupplierResponseDTO(supplier))
})

const getActive = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const { limit = 20 } = req.query

  const suppliers = await supplierService.findActive(
    empresaId,
    req.prisma,
    Number(limit)
  )
  return ApiResponse.success(
    res,
    suppliers.map((s) => new SupplierResponseDTO(s))
  )
})

const create = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const userId = getUserId(req)

  const supplier = await supplierService.create(
    new CreateSupplierDTO(req.body),
    empresaId,
    userId,
    req.prisma
  )
  return ApiResponse.created(
    res,
    new SupplierResponseDTO(supplier),
    MSG.created
  )
})

const update = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const userId = getUserId(req)
  const id = req.params.id as string

  const supplier = await supplierService.update(
    id,
    new UpdateSupplierDTO(req.body),
    userId,
    empresaId,
    req.prisma
  )
  return ApiResponse.success(
    res,
    new SupplierResponseDTO(supplier),
    MSG.updated
  )
})

const deleteSupplier = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const userId = getUserId(req)
  const id = req.params.id as string

  await supplierService.delete(id, userId, empresaId, req.prisma)
  return ApiResponse.success(res, {}, MSG.deleted)
})

const toggleActive = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const userId = getUserId(req)
  const id = req.params.id as string

  const supplier = await supplierService.toggleActive(
    id,
    userId,
    empresaId,
    req.prisma
  )
  return ApiResponse.success(
    res,
    new SupplierResponseDTO(supplier),
    MSG.updated
  )
})

export default {
  getAll,
  getOne,
  getByCode,
  getActive,
  create,
  update,
  delete: deleteSupplier,
  toggleActive,
}
