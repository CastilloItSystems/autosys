// backend/src/features/inventory/adjustments/adjustments.controller.ts

import { Request, Response } from 'express'
import AdjustmentService from './adjustments.service'
import {
  CreateAdjustmentDTO,
  UpdateAdjustmentDTO,
  ApproveAdjustmentDTO,
  ApplyAdjustmentDTO,
  AdjustmentResponseDTO,
  AdjustmentItemResponseDTO,
} from './adjustments.dto'
import { ApiResponse } from '../../../shared/utils/ApiResponse'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware'
import { INVENTORY_MESSAGES } from '../shared/constants/messages'

class AdjustmentController {
  /**
   * GET /api/inventory/adjustments
   * Obtener todos los ajustes con paginación
   */
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 20,
      warehouseId,
      status,
      reason,
      createdFrom,
      createdTo,
      dateFrom,
      dateTo,
      approvedFrom,
      approvedTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query

    const filters: any = {}
    if (warehouseId) filters.warehouseId = warehouseId as string
    if (status) filters.status = status as string
    if (reason) filters.reason = reason as string
    if (createdFrom) filters.createdFrom = new Date(createdFrom as string)
    if (createdTo) filters.createdTo = new Date(createdTo as string)
    if (dateFrom) filters.createdFrom = new Date(dateFrom as string)
    if (dateTo) filters.createdTo = new Date(dateTo as string)
    if (approvedFrom) filters.approvedFrom = new Date(approvedFrom as string)
    if (approvedTo) filters.approvedTo = new Date(approvedTo as string)

    const result = await AdjustmentService.findAll(
      filters,
      Number(page),
      Number(limit),
      sortBy as string,
      (sortOrder as string).toLowerCase() as 'asc' | 'desc',
      req.prisma || undefined
    )

    const items = result.items.map(
      (adjustment) => new AdjustmentResponseDTO(adjustment)
    )

    return ApiResponse.paginated(
      res,
      items,
      result.page,
      result.limit,
      result.total,
      'Ajustes obtenidos exitosamente'
    )
  })

  /**
   * GET /api/inventory/adjustments/:id
   * Obtener un ajuste por ID
   */
  getOne = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { includeItems = true } = req.query

    const adjustment = await AdjustmentService.findById(
      String(id),
      String(includeItems) === 'true'
    )

    const dto = new AdjustmentResponseDTO(adjustment)
    return ApiResponse.success(res, dto, 'Ajuste obtenido exitosamente')
  })

  /**
   * POST /api/inventory/adjustments
   * Crear nuevo ajuste
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId

    const dto = new CreateAdjustmentDTO(req.body)
    const result = await AdjustmentService.create(dto, userId)

    const response = new AdjustmentResponseDTO(result)
    return ApiResponse.created(res, response, 'Ajuste creado exitosamente')
  })

  /**
   * PUT /api/inventory/adjustments/:id
   * Actualizar ajuste
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const dto = new UpdateAdjustmentDTO(req.body)
    const result = await AdjustmentService.update(String(id), dto)

    const response = new AdjustmentResponseDTO(result)
    return ApiResponse.success(res, response, 'Ajuste actualizado exitosamente')
  })

  /**
   * PATCH /api/inventory/adjustments/:id/approve
   * Aprobar ajuste
   */
  approve = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const userId = req.user?.userId

    const result = await AdjustmentService.approve(String(id), userId)

    const response = new AdjustmentResponseDTO(result)
    return ApiResponse.success(res, response, 'Ajuste aprobado exitosamente')
  })

  /**
   * PATCH /api/inventory/adjustments/:id/apply
   * Aplicar ajuste
   */
  apply = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const userId = req.user?.userId

    const result = await AdjustmentService.apply(String(id), userId)

    const response = new AdjustmentResponseDTO(result)
    return ApiResponse.success(res, response, 'Ajuste aplicado exitosamente')
  })

  /**
   * PATCH /api/inventory/adjustments/:id/reject
   * Rechazar ajuste
   */
  reject = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { reason } = req.body

    const result = await AdjustmentService.reject(
      String(id),
      reason || 'Sin especificar'
    )

    const response = new AdjustmentResponseDTO(result)
    return ApiResponse.success(res, response, 'Ajuste rechazado exitosamente')
  })

  /**
   * PATCH /api/inventory/adjustments/:id/cancel
   * Cancelar ajuste
   */
  cancel = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const result = await AdjustmentService.cancel(String(id))

    const response = new AdjustmentResponseDTO(result)
    return ApiResponse.success(res, response, 'Ajuste cancelado exitosamente')
  })

  /**
   * POST /api/inventory/adjustments/:id/items
   * Agregar item a ajuste
   */
  addItem = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const { itemId, quantityChange, unitCost, notes } = req.body
    const result = await AdjustmentService.addItem(String(id), {
      itemId,
      quantityChange,
      unitCost: unitCost ?? null,
      notes: notes ?? null,
    })

    const response = new AdjustmentItemResponseDTO(result)
    return ApiResponse.created(res, response, 'Item agregado exitosamente')
  })

  /**
   * GET /api/inventory/adjustments/:id/items
   * Obtener items de un ajuste
   */
  getItems = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const items = await AdjustmentService.getItems(String(id))

    const response = items.map((item) => new AdjustmentItemResponseDTO(item))
    return ApiResponse.success(res, response, 'Items obtenidos exitosamente')
  })

  /**
   * DELETE /api/inventory/adjustments/:id
   * Eliminar ajuste
   */
  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    await AdjustmentService.delete(String(id))

    return ApiResponse.success(res, {}, 'Ajuste eliminado exitosamente')
  })
}

const adjustmentController = new AdjustmentController()
export { AdjustmentController }
export default adjustmentController
