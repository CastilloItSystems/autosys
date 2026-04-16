import { Request, Response } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { CreateDealerUnitDTO, DealerUnitResponseDTO, UpdateDealerUnitDTO } from './units.dto.js'
import dealerUnitsService from './units.service.js'

function getEmpresaId(req: Request): string {
  if (!req.empresaId) throw new Error('empresaId not set by middleware')
  return req.empresaId
}

function getUserId(req: Request): string {
  const userId = req.user?.userId
  if (!userId) throw new Error('user not set by middleware')
  return userId
}

function parseLimit(raw: unknown, fallback: number): number {
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? Math.min(n, 500) : fallback
}

class DealerUnitsController {
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { brandId, modelId, year, status, condition, isActive, search, page, limit, sortBy, sortOrder } = req.query

    const filters: Record<string, unknown> = {}
    if (brandId) filters.brandId = String(brandId)
    if (modelId) filters.modelId = String(modelId)
    if (year !== undefined) filters.year = Number(year)
    if (status) filters.status = String(status)
    if (condition) filters.condition = String(condition)
    if (isActive !== undefined) filters.isActive = isActive === 'true'
    if (search) filters.search = String(search)

    const pageNum = Number(page) || 1
    const limitNum = parseLimit(limit, 20)
    const sortByField = typeof sortBy === 'string' ? sortBy : 'createdAt'
    const sortOrderDir = sortOrder === 'asc' ? 'asc' : 'desc'

    const result = await dealerUnitsService.findAll(
      filters,
      pageNum,
      limitNum,
      empresaId,
      req.prisma,
      sortByField,
      sortOrderDir
    )

    return ApiResponse.paginated(
      res,
      result.data.map((unit) => new DealerUnitResponseDTO(unit)),
      pageNum,
      limitNum,
      result.total,
      'Unidades obtenidas exitosamente'
    )
  })

  getOne = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const unit = await dealerUnitsService.findById(id, empresaId, req.prisma)
    return ApiResponse.success(res, new DealerUnitResponseDTO(unit), 'Unidad obtenida exitosamente')
  })

  create = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = getUserId(req)
    const dto = new CreateDealerUnitDTO(req.body)
    const created = await dealerUnitsService.create(dto, empresaId, userId, req.prisma)
    return ApiResponse.created(res, new DealerUnitResponseDTO(created), 'Unidad creada exitosamente')
  })

  update = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = getUserId(req)
    const { id } = req.params as { id: string }
    const dto = new UpdateDealerUnitDTO(req.body)
    const updated = await dealerUnitsService.update(id, dto, empresaId, userId, req.prisma)
    return ApiResponse.success(res, new DealerUnitResponseDTO(updated), 'Unidad actualizada exitosamente')
  })

  delete = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = getUserId(req)
    const { id } = req.params as { id: string }
    const result = await dealerUnitsService.delete(id, empresaId, userId, req.prisma)
    return ApiResponse.success(res, result, 'Unidad desactivada exitosamente')
  })
}

export default new DealerUnitsController()
