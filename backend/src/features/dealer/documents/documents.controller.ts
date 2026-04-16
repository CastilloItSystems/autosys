import { Request, Response } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { CreateDealerDocumentDTO, DealerDocumentResponseDTO, UpdateDealerDocumentDTO } from './documents.dto.js'
import service from './documents.service.js'

function getEmpresaId(req: Request): string {
  if (!req.empresaId) throw new Error('empresaId not set by middleware')
  return req.empresaId
}

function getUserId(req: Request): string {
  const userId = req.user?.userId
  if (!userId) throw new Error('user not set by middleware')
  return userId
}

class DealerDocumentsController {
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const {
      dealerUnitId,
      referenceType,
      referenceId,
      status,
      isActive,
      search,
      expiringDays,
      page,
      limit,
      sortBy,
      sortOrder,
    } = req.query

    const filters: Record<string, unknown> = {}
    if (dealerUnitId) filters.dealerUnitId = String(dealerUnitId)
    if (referenceType) filters.referenceType = String(referenceType)
    if (referenceId) filters.referenceId = String(referenceId)
    if (status) filters.status = String(status)
    if (isActive !== undefined) filters.isActive = isActive === 'true'
    if (search) filters.search = String(search)
    if (expiringDays !== undefined) filters.expiringDays = Number(expiringDays)

    const pageNum = Number(page) || 1
    const limitNum = Number(limit) || 20

    const result = await service.findAll(
      filters,
      pageNum,
      limitNum,
      empresaId,
      req.prisma,
      typeof sortBy === 'string' ? sortBy : 'createdAt',
      sortOrder === 'asc' ? 'asc' : 'desc'
    )

    return ApiResponse.paginated(
      res,
      result.data.map((d) => new DealerDocumentResponseDTO(d)),
      pageNum,
      limitNum,
      result.total,
      'Documentos obtenidos exitosamente'
    )
  })

  getOne = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const item = await service.findById(id, getEmpresaId(req), req.prisma)
    return ApiResponse.success(res, new DealerDocumentResponseDTO(item), 'Documento obtenido exitosamente')
  })

  create = asyncHandler(async (req: Request, res: Response) => {
    const dto = new CreateDealerDocumentDTO(req.body)
    const created = await service.create(dto, getEmpresaId(req), getUserId(req), req.prisma)
    return ApiResponse.created(res, new DealerDocumentResponseDTO(created), 'Documento creado exitosamente')
  })

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const dto = new UpdateDealerDocumentDTO(req.body)
    const updated = await service.update(id, dto, getEmpresaId(req), getUserId(req), req.prisma)
    return ApiResponse.success(res, new DealerDocumentResponseDTO(updated), 'Documento actualizado exitosamente')
  })

  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const result = await service.delete(id, getEmpresaId(req), getUserId(req), req.prisma)
    return ApiResponse.success(res, result, 'Documento desactivado exitosamente')
  })
}

export default new DealerDocumentsController()
