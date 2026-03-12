// backend/src/features/inventory/adjustments/adjustments.controller.ts

import { Request, Response } from 'express'
import adjustmentService from './adjustments.service.js'
import {
  CreateAdjustmentDTO,
  UpdateAdjustmentDTO,
  AdjustmentResponseDTO,
  AdjustmentItemResponseDTO,
} from './adjustments.dto.js'
import { AdjustmentStatus } from './adjustments.interface.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { IAdjustmentFilters } from './adjustments.interface.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getEmpresaId(req: Request): string {
  if (!req.empresaId) throw new Error('empresaId not set by middleware')
  return req.empresaId
}

const SORT_WHITELIST = new Set([
  'createdAt',
  'updatedAt',
  'adjustmentNumber',
  'status',
  'appliedAt',
])

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

class AdjustmentController {
  /**
   * GET /api/inventory/adjustments
   */
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const {
      page,
      limit,
      warehouseId,
      status,
      reason,
      createdFrom,
      createdTo,
      approvedFrom,
      approvedTo,
      sortBy,
      sortOrder,
    } = req.query

    const filters: IAdjustmentFilters = {}
    if (warehouseId) filters.warehouseId = String(warehouseId)
    if (
      status &&
      Object.values(AdjustmentStatus).includes(status as AdjustmentStatus)
    )
      filters.status = status as AdjustmentStatus
    if (reason) filters.reason = String(reason)
    if (createdFrom) filters.createdFrom = new Date(String(createdFrom))
    if (createdTo) filters.createdTo = new Date(String(createdTo))
    if (approvedFrom) filters.approvedFrom = new Date(String(approvedFrom))
    if (approvedTo) filters.approvedTo = new Date(String(approvedTo))

    const pageNum = Math.max(Number(page) || 1, 1)
    const limitNum = Math.min(Number(limit) || 20, 500)
    const sortField = SORT_WHITELIST.has(String(sortBy))
      ? String(sortBy)
      : 'createdAt'
    const sortDir = String(sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc'

    const result = await adjustmentService.findAll(
      filters,
      pageNum,
      limitNum,
      empresaId,
      sortField,
      sortDir,
      req.prisma
    )

    const items = result.items.map((a) => new AdjustmentResponseDTO(a))
    return ApiResponse.paginated(
      res,
      items,
      pageNum,
      limitNum,
      result.total,
      'Ajustes obtenidos exitosamente'
    )
  })

  /**
   * GET /api/inventory/adjustments/:id
   */
  getOne = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }

    const adjustment = await adjustmentService.findById(
      id,
      empresaId,
      req.prisma
    )
    return ApiResponse.success(
      res,
      new AdjustmentResponseDTO(adjustment),
      'Ajuste obtenido exitosamente'
    )
  })

  /**
   * POST /api/inventory/adjustments
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId ?? 'system'

    const dto = new CreateAdjustmentDTO(req.body)
    const result = await adjustmentService.create(
      dto,
      empresaId,
      userId,
      req.prisma
    )
    return ApiResponse.created(
      res,
      new AdjustmentResponseDTO(result),
      'Ajuste creado exitosamente'
    )
  })

  /**
   * PUT /api/inventory/adjustments/:id
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }

    const dto = new UpdateAdjustmentDTO(req.body)
    const result = await adjustmentService.update(
      id,
      dto,
      empresaId,
      req.prisma
    )
    return ApiResponse.success(
      res,
      new AdjustmentResponseDTO(result),
      'Ajuste actualizado exitosamente'
    )
  })

  /**
   * PATCH /api/inventory/adjustments/:id/approve
   */
  approve = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId ?? 'system'
    const { id } = req.params as { id: string }

    const result = await adjustmentService.approve(
      id,
      empresaId,
      userId,
      req.prisma
    )
    return ApiResponse.success(
      res,
      new AdjustmentResponseDTO(result),
      'Ajuste aprobado exitosamente'
    )
  })

  /**
   * PATCH /api/inventory/adjustments/:id/apply
   */
  apply = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId ?? 'system'
    const { id } = req.params as { id: string }

    const result = await adjustmentService.apply(
      id,
      empresaId,
      userId,
      req.prisma
    )
    return ApiResponse.success(
      res,
      new AdjustmentResponseDTO(result),
      'Ajuste aplicado exitosamente'
    )
  })

  /**
   * PATCH /api/inventory/adjustments/:id/reject
   */
  reject = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const reason = String(req.body.reason ?? 'Sin especificar')

    const result = await adjustmentService.reject(
      id,
      reason,
      empresaId,
      req.prisma
    )
    return ApiResponse.success(
      res,
      new AdjustmentResponseDTO(result),
      'Ajuste rechazado exitosamente'
    )
  })

  /**
   * PATCH /api/inventory/adjustments/:id/cancel
   */
  cancel = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }

    const result = await adjustmentService.cancel(id, empresaId, req.prisma)
    return ApiResponse.success(
      res,
      new AdjustmentResponseDTO(result),
      'Ajuste cancelado exitosamente'
    )
  })

  /**
   * POST /api/inventory/adjustments/:id/items
   */
  addItem = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const { itemId, quantityChange, unitCost, notes } = req.body

    const result = await adjustmentService.addItem(
      id,
      {
        itemId: String(itemId),
        quantityChange: Number(quantityChange),
        unitCost: unitCost !== undefined ? Number(unitCost) : null,
        notes: notes !== undefined ? String(notes) : null,
      },
      empresaId,
      req.prisma
    )
    return ApiResponse.created(
      res,
      new AdjustmentItemResponseDTO(result),
      'Ítem agregado exitosamente'
    )
  })

  /**
   * GET /api/inventory/adjustments/:id/items
   */
  getItems = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }

    const items = await adjustmentService.getItems(id, empresaId, req.prisma)
    return ApiResponse.success(
      res,
      items.map((i) => new AdjustmentItemResponseDTO(i)),
      'Ítems obtenidos exitosamente'
    )
  })

  /**
   * DELETE /api/inventory/adjustments/:id
   */
  delete = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }

    await adjustmentService.delete(id, empresaId, req.prisma)
    return ApiResponse.success(res, {}, 'Ajuste eliminado exitosamente')
  })
}

export default new AdjustmentController()
