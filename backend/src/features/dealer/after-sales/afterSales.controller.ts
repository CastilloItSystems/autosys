import { Request, Response } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { CreateDealerAfterSaleDTO, DealerAfterSaleResponseDTO, UpdateDealerAfterSaleDTO } from './afterSales.dto.js'
import service from './afterSales.service.js'

function getEmpresaId(req: Request): string {
  if (!req.empresaId) throw new Error('empresaId not set by middleware')
  return req.empresaId
}

function getUserId(req: Request): string {
  const userId = req.user?.userId
  if (!userId) throw new Error('user not set by middleware')
  return userId
}

class DealerAfterSalesController {
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const filters: Record<string, unknown> = {}
    if (req.query.dealerUnitId) filters.dealerUnitId = String(req.query.dealerUnitId)
    if (req.query.type) filters.type = String(req.query.type)
    if (req.query.status) filters.status = String(req.query.status)
    if (req.query.isActive !== undefined) filters.isActive = req.query.isActive === 'true'
    if (req.query.search) filters.search = String(req.query.search)

    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 20
    const sortBy = typeof req.query.sortBy === 'string' ? req.query.sortBy : 'createdAt'
    const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc'

    const result = await service.findAll(filters, page, limit, getEmpresaId(req), req.prisma, sortBy, sortOrder)
    return ApiResponse.paginated(
      res,
      result.data.map((x) => new DealerAfterSaleResponseDTO(x)),
      page,
      limit,
      result.total,
      'Casos de postventa obtenidos exitosamente'
    )
  })

  getOne = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const item = await service.findById(id, getEmpresaId(req), req.prisma)
    return ApiResponse.success(res, new DealerAfterSaleResponseDTO(item), 'Caso de postventa obtenido exitosamente')
  })

  create = asyncHandler(async (req: Request, res: Response) => {
    const dto = new CreateDealerAfterSaleDTO(req.body)
    const created = await service.create(dto, getEmpresaId(req), getUserId(req), req.prisma)
    return ApiResponse.created(res, new DealerAfterSaleResponseDTO(created), 'Caso de postventa creado exitosamente')
  })

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const dto = new UpdateDealerAfterSaleDTO(req.body)
    const updated = await service.update(id, dto, getEmpresaId(req), getUserId(req), req.prisma)
    return ApiResponse.success(res, new DealerAfterSaleResponseDTO(updated), 'Caso de postventa actualizado exitosamente')
  })

  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const result = await service.delete(id, getEmpresaId(req), getUserId(req), req.prisma)
    return ApiResponse.success(res, result, 'Caso de postventa desactivado exitosamente')
  })
}

export default new DealerAfterSalesController()
