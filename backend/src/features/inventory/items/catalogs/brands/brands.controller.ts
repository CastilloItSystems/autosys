// backend/src/features/inventory/items/catalogs/brands/brands.controller.ts

import { Request, Response } from 'express'
import { BrandService } from './brands.service'
import { CreateBrandDTO, UpdateBrandDTO, BrandResponseDTO } from './brands.dto'
import { IBrandFilters, BrandType } from './brands.interface'
import { ApiResponse } from '../../../../../shared/utils/apiResponse'
import { asyncHandler } from '../../../../../shared/middleware/asyncHandler.middleware'
import { INVENTORY_MESSAGES } from '../../../shared/constants/messages'

const brandService = new BrandService()

export class BrandController {
  /**
   * GET /api/inventory/catalogs/brands
   * Obtener todas las marcas con filtros y paginación
   */
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, search, type, isActive } = req.query

    const filters: IBrandFilters = {}
    if (search) filters.search = search as string
    if (type) filters.type = type as BrandType
    if (isActive === 'true') filters.isActive = true
    if (isActive === 'false') filters.isActive = false

    filters.page = Number(page) || 1
    filters.limit = Number(limit) || 10

    const result = await brandService.getBrands(
      filters,
      req.prisma || undefined
    )
    const brands = result.brands.map((brand) => new BrandResponseDTO(brand))

    return ApiResponse.paginated(
      res,
      brands,
      result.page,
      result.limit,
      result.total,
      'Marcas obtenidas exitosamente'
    )
  })

  /**
   * GET /api/inventory/catalogs/brands/grouped
   * Obtener marcas agrupadas por tipo
   */
  getGrouped = asyncHandler(async (req: Request, res: Response) => {
    const { search, isActive } = req.query

    const filters: { search?: string; isActive?: boolean } = {}
    if (search) filters.search = search as string
    if (isActive === 'true') filters.isActive = true
    if (isActive === 'false') filters.isActive = false

    const groups = await brandService.getBrandsGroupedByType(
      filters,
      req.prisma || undefined
    )

    return ApiResponse.success(
      res,
      { groups },
      'Marcas agrupadas obtenidas exitosamente'
    )
  })

  /**
   * GET /api/inventory/catalogs/brands/active
   * Obtener solo marcas activas (para selects)
   */
  getActive = asyncHandler(async (req: Request, res: Response) => {
    const type = req.query.type as BrandType | undefined

    const brands = await brandService.getActiveBrands(
      type,
      req.prisma || undefined
    )
    const response = brands.map((brand) => new BrandResponseDTO(brand))

    return ApiResponse.paginated(
      res,
      response,
      1,
      response.length,
      response.length,
      'Marcas activas obtenidas exitosamente'
    )
  })

  /**
   * GET /api/inventory/catalogs/brands/search
   * Buscar marcas
   */
  search = asyncHandler(async (req: Request, res: Response) => {
    const { q: query, type } = req.query

    if (!query) {
      return ApiResponse.badRequest(res, 'El término de búsqueda es requerido')
    }

    if ((query as string).length < 2) {
      return ApiResponse.paginated(res, [], 1, 0, 0, 'Búsqueda completada')
    }

    const brands = await brandService.searchBrands(
      query as string,
      type as BrandType | undefined,
      req.prisma || undefined
    )
    const response = brands.map((brand) => new BrandResponseDTO(brand))

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
   * GET /api/inventory/catalogs/brands/:id
   * Obtener marca por ID
   */
  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }

    const brand = await brandService.getBrandById(id)
    const response = new BrandResponseDTO(brand)

    return ApiResponse.success(res, response, 'Marca obtenida exitosamente')
  })

  /**
   * GET /api/inventory/catalogs/brands/:id/stats
   * Obtener estadísticas de una marca
   */
  getStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await brandService.getBrandStats()

    return ApiResponse.success(
      res,
      stats,
      'Estadísticas obtenidas exitosamente'
    )
  })

  /**
   * POST /api/inventory/catalogs/brands
   * Crear nueva marca
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const dto = new CreateBrandDTO(req.body)

    const brand = await brandService.createBrand(dto)
    const response = new BrandResponseDTO(brand)

    return ApiResponse.created(res, response, INVENTORY_MESSAGES.brand.created)
  })

  /**
   * PUT /api/inventory/catalogs/brands/:id
   * Actualizar marca
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const dto = new UpdateBrandDTO(req.body)

    const brand = await brandService.updateBrand(id, dto)
    const response = new BrandResponseDTO(brand)

    return ApiResponse.success(res, response, INVENTORY_MESSAGES.brand.updated)
  })

  /**
   * PATCH /api/inventory/catalogs/brands/:id/toggle
   * Activar/Desactivar marca
   */
  toggleActive = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }

    const brand = await brandService.toggleBrand(id)
    const response = new BrandResponseDTO(brand)

    const message = brand.isActive
      ? 'Marca activada exitosamente'
      : 'Marca desactivada exitosamente'

    return ApiResponse.success(res, response, message)
  })

  /**
   * PATCH /api/inventory/catalogs/brands/:id/reactivate
   * Reactivar marca (solo activa, no desactiva)
   */
  reactivate = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }

    const brand = await brandService.reactivateBrand(id)
    const response = new BrandResponseDTO(brand)

    return ApiResponse.success(res, response, 'Marca reactivada exitosamente')
  })

  /**
   * DELETE /api/inventory/catalogs/brands/:id
   * Eliminar marca (soft delete)
   */
  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }

    await brandService.deleteBrand(id)

    return ApiResponse.success(res, null, INVENTORY_MESSAGES.brand.deleted)
  })

  /**
   * DELETE /api/inventory/catalogs/brands/:id/hard
   * Eliminar marca permanentemente (hard delete)
   */
  hardDelete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }

    await brandService.deleteBrandPermanently(id)

    return ApiResponse.success(res, null, 'Marca eliminada permanentemente')
  })
}

export default new BrandController()
