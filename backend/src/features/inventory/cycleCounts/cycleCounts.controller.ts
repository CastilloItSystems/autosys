// backend/src/features/inventory/cycleCounts/cycleCounts.controller.ts

import { Request, Response } from 'express'
import { CycleCountServiceInstance } from './cycleCounts.service'
import {
  CreateCycleCountDTO,
  UpdateCycleCountDTO,
  StartCycleCountDTO,
  CompleteCycleCountDTO,
  ApproveCycleCountDTO,
  ApplyCycleCountDTO,
  CycleCountResponseDTO,
} from './cycleCounts.dto'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware'
import { ApiResponse } from '../../../shared/utils/ApiResponse'
import { INVENTORY_MESSAGES } from '../shared/constants/messages'

export const CycleCountController = {
  /**
   * Obtener todos los ciclos de conteo
   */
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const {
      warehouseId,
      status,
      notes,
      page = '1',
      limit = '10',
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = req.query

    const filters: any = {}
    if (warehouseId) filters.warehouseId = warehouseId as string
    if (status) filters.status = status as string
    if (notes) filters.notes = notes as string

    const result = await CycleCountServiceInstance.findAll(
      filters,
      page as string,
      limit as string,
      sortBy as string,
      sortOrder as string
    )

    const dtos = result.data.map((cc) => new CycleCountResponseDTO(cc))

    return ApiResponse.paginated(
      res,
      dtos,
      Number(page),
      Number(limit),
      result.total,
      INVENTORY_MESSAGES.cycleCount.created
    )
  }),

  /**
   * Obtener ciclo de conteo por ID
   */
  getOne: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { includeItems = true } = req.query

    const cycleCount = await CycleCountServiceInstance.findById(
      String(id),
      includeItems === 'true'
    )
    const dto = new CycleCountResponseDTO(cycleCount)

    return ApiResponse.success(
      res,
      dto,
      'Ciclo de conteo obtenido exitosamente'
    )
  }),

  /**
   * Crear nuevo ciclo de conteo
   */
  create: asyncHandler(async (req: Request, res: Response) => {
    const dto = new CreateCycleCountDTO(req.body)
    const userId = (req as any).user?.id || 'system'

    const cycleCount = await CycleCountServiceInstance.create(dto, userId)
    const responseDto = new CycleCountResponseDTO(cycleCount)

    return ApiResponse.created(
      res,
      responseDto,
      INVENTORY_MESSAGES.cycleCount.created
    )
  }),

  /**
   * Actualizar ciclo de conteo
   */
  update: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const dto = new UpdateCycleCountDTO(req.body)

    const cycleCount = await CycleCountServiceInstance.update(String(id), dto)
    const responseDto = new CycleCountResponseDTO(cycleCount)

    return ApiResponse.success(
      res,
      responseDto,
      INVENTORY_MESSAGES.cycleCount.updated
    )
  }),

  /**
   * Iniciar ciclo de conteo
   */
  start: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const dto = new StartCycleCountDTO(req.body)

    const cycleCount = await CycleCountServiceInstance.start(
      String(id),
      dto.startedBy
    )
    const responseDto = new CycleCountResponseDTO(cycleCount)

    return ApiResponse.success(res, responseDto, 'Ciclo de conteo iniciado')
  }),

  /**
   * Completar ciclo de conteo
   */
  complete: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const dto = new CompleteCycleCountDTO(req.body)

    const cycleCount = await CycleCountServiceInstance.complete(
      String(id),
      dto.completedBy
    )
    const responseDto = new CycleCountResponseDTO(cycleCount)

    return ApiResponse.success(
      res,
      responseDto,
      INVENTORY_MESSAGES.cycleCount.completed
    )
  }),

  /**
   * Aprobar ciclo de conteo
   */
  approve: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const dto = new ApproveCycleCountDTO(req.body)

    const cycleCount = await CycleCountServiceInstance.approve(
      String(id),
      dto.approvedBy
    )
    const responseDto = new CycleCountResponseDTO(cycleCount)

    return ApiResponse.success(
      res,
      responseDto,
      INVENTORY_MESSAGES.cycleCount.approved
    )
  }),

  /**
   * Aplicar ciclo de conteo
   */
  apply: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const dto = new ApplyCycleCountDTO(req.body)

    const cycleCount = await CycleCountServiceInstance.apply(
      String(id),
      dto.appliedBy
    )
    const responseDto = new CycleCountResponseDTO(cycleCount)

    return ApiResponse.success(
      res,
      responseDto,
      INVENTORY_MESSAGES.cycleCount.applied
    )
  }),

  /**
   * Rechazar ciclo de conteo
   */
  reject: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { reason = '' } = req.body

    const cycleCount = await CycleCountServiceInstance.reject(
      String(id),
      reason
    )
    const responseDto = new CycleCountResponseDTO(cycleCount)

    return ApiResponse.success(
      res,
      responseDto,
      INVENTORY_MESSAGES.cycleCount.rejected
    )
  }),

  /**
   * Cancelar ciclo de conteo
   */
  cancel: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const cycleCount = await CycleCountServiceInstance.cancel(String(id))
    const responseDto = new CycleCountResponseDTO(cycleCount)

    return ApiResponse.success(
      res,
      responseDto,
      INVENTORY_MESSAGES.cycleCount.cancelled
    )
  }),

  /**
   * Agregar item al ciclo de conteo
   */
  addItem: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { itemId, expectedQuantity, location, notes } = req.body

    const item = await CycleCountServiceInstance.addItem(String(id), {
      itemId,
      expectedQuantity,
      location: location ?? null,
      notes: notes ?? null,
    })

    return ApiResponse.created(res, item, 'Item agregado al ciclo de conteo')
  }),

  /**
   * Obtener items del ciclo de conteo
   */
  getItems: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const items = await CycleCountServiceInstance.getItems(String(id))

    return ApiResponse.success(
      res,
      items,
      'Items del ciclo de conteo obtenidos'
    )
  }),

  /**
   * Actualizar cantidad contada de un item
   */
  updateItemCountedQuantity: asyncHandler(
    async (req: Request, res: Response) => {
      const { id, itemId } = req.params
      const { countedQuantity } = req.body

      const item = await CycleCountServiceInstance.updateItemCountedQuantity(
        String(id),
        String(itemId),
        Number(countedQuantity)
      )

      return ApiResponse.success(res, item, 'Cantidad contada actualizada')
    }
  ),

  /**
   * Eliminar ciclo de conteo
   */
  delete: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    await CycleCountServiceInstance.delete(String(id))

    return ApiResponse.success(res, null, INVENTORY_MESSAGES.cycleCount.deleted)
  }),
}
