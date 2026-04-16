import { Request, Response } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { CreateDealerTestDriveDTO, DealerTestDriveResponseDTO, UpdateDealerTestDriveDTO } from './testDrives.dto.js'
import dealerTestDrivesService from './testDrives.service.js'

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

class DealerTestDrivesController {
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { dealerUnitId, status, isActive, search, fromDate, toDate, page, limit, sortBy, sortOrder } = req.query

    const filters: Record<string, unknown> = {}
    if (dealerUnitId) filters.dealerUnitId = String(dealerUnitId)
    if (status) filters.status = String(status)
    if (isActive !== undefined) filters.isActive = isActive === 'true'
    if (search) filters.search = String(search)
    if (fromDate) filters.fromDate = new Date(String(fromDate))
    if (toDate) filters.toDate = new Date(String(toDate))

    const pageNum = Number(page) || 1
    const limitNum = parseLimit(limit, 20)
    const sortByField = typeof sortBy === 'string' ? sortBy : 'scheduledAt'
    const sortOrderDir = sortOrder === 'asc' ? 'asc' : 'desc'

    const result = await dealerTestDrivesService.findAll(
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
      result.data.map((testDrive) => new DealerTestDriveResponseDTO(testDrive)),
      pageNum,
      limitNum,
      result.total,
      'Pruebas de manejo obtenidas exitosamente'
    )
  })

  getOne = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const testDrive = await dealerTestDrivesService.findById(id, empresaId, req.prisma)
    return ApiResponse.success(res, new DealerTestDriveResponseDTO(testDrive), 'Prueba de manejo obtenida exitosamente')
  })

  create = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = getUserId(req)
    const dto = new CreateDealerTestDriveDTO(req.body)
    const created = await dealerTestDrivesService.create(dto, empresaId, userId, req.prisma)
    return ApiResponse.created(res, new DealerTestDriveResponseDTO(created), 'Prueba de manejo creada exitosamente')
  })

  update = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = getUserId(req)
    const { id } = req.params as { id: string }
    const dto = new UpdateDealerTestDriveDTO(req.body)
    const updated = await dealerTestDrivesService.update(id, dto, empresaId, userId, req.prisma)
    return ApiResponse.success(res, new DealerTestDriveResponseDTO(updated), 'Prueba de manejo actualizada exitosamente')
  })

  delete = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = getUserId(req)
    const { id } = req.params as { id: string }
    const result = await dealerTestDrivesService.delete(id, empresaId, userId, req.prisma)
    return ApiResponse.success(res, result, 'Prueba de manejo anulada exitosamente')
  })
}

export default new DealerTestDrivesController()
