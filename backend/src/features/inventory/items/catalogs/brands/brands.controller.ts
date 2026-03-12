// backend/src/features/inventory/items/catalogs/brands/brands.controller.ts

import { Request, Response } from 'express'
import brandService from './brands.service.js'
import {
  CreateBrandDTO,
  UpdateBrandDTO,
  BrandResponseDTO,
  BrandGroupDTO,
} from './brands.dto.js'
import { BrandType } from './brands.interface.js'
import { ApiResponse } from '../../../../../shared/utils/apiResponse.js'
import { asyncHandler } from '../../../../../shared/middleware/asyncHandler.middleware.js'
import { INVENTORY_MESSAGES } from '../../../shared/constants/messages.js'

const MSG = INVENTORY_MESSAGES.brand

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

  const filters: {
    search?: string
    type?: BrandType
    isActive?: boolean
    page?: number
    limit?: number
  } = {
    page: Number(page) || 1,
    limit: Number(limit) || 10,
  }
  if (search) filters.search = search as string
  if (type) filters.type = type as BrandType
  if (isActive === 'true') filters.isActive = true
  if (isActive === 'false') filters.isActive = false

  const result = await brandService.getBrands(empresaId, filters, req.prisma)
  const brands = result.brands.map((b) => new BrandResponseDTO(b))

  return ApiResponse.paginated(
    res,
    brands,
    result.page,
    result.limit,
    result.total
  )
})

const getGrouped = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const { search, isActive } = req.query

  const filters: { search?: string; isActive?: boolean } = {}
  if (search) filters.search = search as string
  if (isActive === 'true') filters.isActive = true
  if (isActive === 'false') filters.isActive = false

  const groups = await brandService.getBrandsGroupedByType(
    empresaId,
    filters,
    req.prisma
  )

  return ApiResponse.success(res, {
    groups: groups.map((g) => new BrandGroupDTO(g)),
    totalBrands: groups.reduce((s, g) => s + g.count, 0),
  })
})

const getActive = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const type = req.query.type as BrandType | undefined

  const brands = await brandService.getActiveBrands(empresaId, req.prisma, type)
  return ApiResponse.success(
    res,
    brands.map((b) => new BrandResponseDTO(b))
  )
})

const search = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const { q: query, type } = req.query

  if (!query)
    return ApiResponse.badRequest(res, 'El término de búsqueda es requerido')

  if ((query as string).length < 2) {
    return ApiResponse.success(res, [])
  }

  const brands = await brandService.searchBrands(
    empresaId,
    query as string,
    req.prisma,
    type as BrandType | undefined
  )
  return ApiResponse.success(
    res,
    brands.map((b) => new BrandResponseDTO(b))
  )
})

const getById = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const brand = await brandService.getBrandById(
    empresaId,
    req.params.id as string,
    req.prisma
  )
  return ApiResponse.success(res, new BrandResponseDTO(brand))
})

const getStats = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const stats = await brandService.getBrandStats(empresaId, req.prisma)
  return ApiResponse.success(res, stats)
})

// ---------------------------------------------------------------------------
// POST
// ---------------------------------------------------------------------------

const create = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const brand = await brandService.createBrand(
    empresaId,
    new CreateBrandDTO(req.body) as never,
    getUserId(req),
    req.prisma
  )
  return ApiResponse.created(res, new BrandResponseDTO(brand), MSG.created)
})

// ---------------------------------------------------------------------------
// PUT / PATCH
// ---------------------------------------------------------------------------

const update = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const brand = await brandService.updateBrand(
    empresaId,
    req.params.id as string,
    new UpdateBrandDTO(req.body) as never,
    getUserId(req),
    req.prisma
  )
  return ApiResponse.success(res, new BrandResponseDTO(brand), MSG.updated)
})

const toggleActive = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const brand = await brandService.toggleBrand(
    empresaId,
    req.params.id as string,
    getUserId(req),
    req.prisma
  )
  const message = brand.isActive
    ? 'Marca activada exitosamente'
    : 'Marca desactivada exitosamente'
  return ApiResponse.success(res, new BrandResponseDTO(brand), message)
})

const reactivate = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const brand = await brandService.reactivateBrand(
    empresaId,
    req.params.id as string,
    getUserId(req),
    req.prisma
  )
  return ApiResponse.success(
    res,
    new BrandResponseDTO(brand),
    'Marca reactivada exitosamente'
  )
})

// ---------------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------------

const deleteBrand = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  await brandService.deleteBrand(
    empresaId,
    req.params.id as string,
    getUserId(req),
    req.prisma
  )
  return ApiResponse.success(res, null, MSG.deleted)
})

const hardDelete = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  await brandService.deleteBrandPermanently(
    empresaId,
    req.params.id as string,
    getUserId(req),
    req.prisma
  )
  return ApiResponse.success(res, null, 'Marca eliminada permanentemente')
})

export default {
  getAll,
  getGrouped,
  getActive,
  search,
  getById,
  getStats,
  create,
  update,
  toggleActive,
  reactivate,
  delete: deleteBrand,
  hardDelete,
}
