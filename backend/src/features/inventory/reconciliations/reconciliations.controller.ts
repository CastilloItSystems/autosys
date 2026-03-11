// backend/src/features/inventory/reconciliations/reconciliations.controller.ts

import { Request, Response } from 'express'
import { ReconciliationServiceInstance } from './reconciliations.service'
import {
  CreateReconciliationDTO,
  UpdateReconciliationDTO,
  StartReconciliationDTO,
  CompleteReconciliationDTO,
  ApproveReconciliationDTO,
  ApplyReconciliationDTO,
  ReconciliationResponseDTO,
} from './reconciliations.dto'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware'
import { ApiResponse } from '../../../shared/utils/apiResponse'
import { INVENTORY_MESSAGES } from '../shared/constants/messages'

export const ReconciliationController = {
  /**
   * Obtener todas las reconciliaciones
   */
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const {
      warehouseId,
      status,
      source,
      reason,
      page = '1',
      limit = '10',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query

    const filters: any = {}
    if (warehouseId) filters.warehouseId = warehouseId as string
    if (status) filters.status = status as string
    if (source) filters.source = source as string
    if (reason) filters.reason = reason as string

    const result = await ReconciliationServiceInstance.findAll(
      filters,
      page as string,
      limit as string,
      sortBy as string,
      sortOrder as string,
      req.prisma || undefined
    )

    const dtos = result.data.map((r) => new ReconciliationResponseDTO(r))

    return ApiResponse.paginated(
      res,
      dtos,
      Number(page),
      Number(limit),
      result.total,
      'Reconciliaciones obtenidas exitosamente'
    )
  }),

  /**
   * Obtener reconciliación por ID
   */
  getOne: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { includeItems = true } = req.query

    const reconciliation = await ReconciliationServiceInstance.findById(
      String(id),
      includeItems === 'true'
    )
    const dto = new ReconciliationResponseDTO(reconciliation)

    return ApiResponse.success(res, dto, 'Reconciliación obtenida exitosamente')
  }),

  /**
   * Crear nueva reconciliación
   */
  create: asyncHandler(async (req: Request, res: Response) => {
    const dto = new CreateReconciliationDTO(req.body)
    const userId = (req as any).user?.id || 'system'

    const reconciliation = await ReconciliationServiceInstance.create(
      dto,
      userId
    )
    const responseDto = new ReconciliationResponseDTO(reconciliation)

    return ApiResponse.created(
      res,
      responseDto,
      INVENTORY_MESSAGES.reconciliation.created
    )
  }),

  /**
   * Actualizar reconciliación
   */
  update: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const dto = new UpdateReconciliationDTO(req.body)

    const reconciliation = await ReconciliationServiceInstance.update(
      String(id),
      dto
    )
    const responseDto = new ReconciliationResponseDTO(reconciliation)

    return ApiResponse.success(
      res,
      responseDto,
      INVENTORY_MESSAGES.reconciliation.updated
    )
  }),

  /**
   * Iniciar reconciliación
   */
  start: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const dto = new StartReconciliationDTO(req.body)

    const reconciliation = await ReconciliationServiceInstance.start(
      String(id),
      dto.startedBy
    )
    const responseDto = new ReconciliationResponseDTO(reconciliation)

    return ApiResponse.success(res, responseDto, 'Reconciliación iniciada')
  }),

  /**
   * Completar reconciliación
   */
  complete: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const dto = new CompleteReconciliationDTO(req.body)

    const reconciliation = await ReconciliationServiceInstance.complete(
      String(id),
      dto.completedBy
    )
    const responseDto = new ReconciliationResponseDTO(reconciliation)

    return ApiResponse.success(
      res,
      responseDto,
      INVENTORY_MESSAGES.reconciliation.completed
    )
  }),

  /**
   * Aprobar reconciliación
   */
  approve: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const dto = new ApproveReconciliationDTO(req.body)

    const reconciliation = await ReconciliationServiceInstance.approve(
      String(id),
      dto.approvedBy
    )
    const responseDto = new ReconciliationResponseDTO(reconciliation)

    return ApiResponse.success(
      res,
      responseDto,
      INVENTORY_MESSAGES.reconciliation.approved
    )
  }),

  /**
   * Aplicar reconciliación
   */
  apply: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const dto = new ApplyReconciliationDTO(req.body)

    const reconciliation = await ReconciliationServiceInstance.apply(
      String(id),
      dto.appliedBy
    )
    const responseDto = new ReconciliationResponseDTO(reconciliation)

    return ApiResponse.success(
      res,
      responseDto,
      INVENTORY_MESSAGES.reconciliation.applied
    )
  }),

  /**
   * Rechazar reconciliación
   */
  reject: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { reason = '' } = req.body

    const reconciliation = await ReconciliationServiceInstance.reject(
      String(id),
      reason
    )
    const responseDto = new ReconciliationResponseDTO(reconciliation)

    return ApiResponse.success(
      res,
      responseDto,
      INVENTORY_MESSAGES.reconciliation.rejected
    )
  }),

  /**
   * Cancelar reconciliación
   */
  cancel: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const reconciliation = await ReconciliationServiceInstance.cancel(
      String(id)
    )
    const responseDto = new ReconciliationResponseDTO(reconciliation)

    return ApiResponse.success(
      res,
      responseDto,
      INVENTORY_MESSAGES.reconciliation.cancelled
    )
  }),

  /**
   * Agregar item a la reconciliación
   */
  addItem: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { itemId, systemQuantity, expectedQuantity, notes } = req.body

    const item = await ReconciliationServiceInstance.addItem(String(id), {
      itemId,
      systemQuantity,
      expectedQuantity,
      notes: notes ?? null,
    })

    return ApiResponse.created(res, item, 'Item agregado a la reconciliación')
  }),

  /**
   * Obtener items de la reconciliación
   */
  getItems: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const items = await ReconciliationServiceInstance.getItems(String(id))

    return ApiResponse.success(
      res,
      items,
      'Items de la reconciliación obtenidos'
    )
  }),

  /**
   * Eliminar reconciliación
   */
  delete: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    await ReconciliationServiceInstance.delete(String(id))

    return ApiResponse.success(
      res,
      null,
      INVENTORY_MESSAGES.reconciliation.deleted
    )
  }),
}
