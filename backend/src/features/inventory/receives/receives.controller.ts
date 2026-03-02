// backend/src/features/inventory/receives/receives.controller.ts

import { Request, Response } from 'express'
import ReceiveService from './receives.service'
import { CreateReceiveDTO } from './receives.dto'
import { UpdateReceiveDTO } from './receives.dto'
import { CreateReceiveItemDTO } from './receives.dto'
import { ReceiveResponseDTO } from './receives.dto'
import { ReceiveItemResponseDTO } from './receives.dto'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware'

class ReceiveController {
  /**
   * GET /api/inventory/receives
   * Obtener todas las recepciones con paginación
   */
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 20,
      purchaseOrderId,
      warehouseId,
      receivedBy,
      receivedFrom,
      receivedTo,
      sortBy = 'receivedAt',
      sortOrder = 'desc',
    } = req.query

    const filters: any = {}
    if (purchaseOrderId) filters.purchaseOrderId = purchaseOrderId as string
    if (warehouseId) filters.warehouseId = warehouseId as string
    if (receivedBy) filters.receivedBy = receivedBy as string
    if (receivedFrom) filters.receivedFrom = new Date(receivedFrom as string)
    if (receivedTo) filters.receivedTo = new Date(receivedTo as string)

    const result = await ReceiveService.findAll(
      filters,
      Number(page),
      Number(limit),
      sortBy as string,
      (sortOrder as string).toLowerCase() as 'asc' | 'desc',
      req.prisma || undefined
    )

    const items = result.items.map((receive) => new ReceiveResponseDTO(receive))

    return res.json({
      success: true,
      data: items,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
    })
  })

  /**
   * GET /api/inventory/receives/:id
   * Obtener una recepción por ID
   */
  getOne = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { includeItems = true } = req.query

    const receive = await ReceiveService.findById(
      String(id),
      includeItems === 'true'
    )

    const dto = new ReceiveResponseDTO(receive)
    return res.json({ success: true, data: dto })
  })

  /**
   * POST /api/inventory/receives
   * Crear nueva recepción
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id

    const dto = new CreateReceiveDTO(req.body)
    const result = await ReceiveService.create(dto, userId)

    const response = new ReceiveResponseDTO(result)
    return res
      .status(201)
      .json({ success: true, message: 'Recepción creada', data: response })
  })

  /**
   * PUT /api/inventory/receives/:id
   * Actualizar recepción
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const dto = new UpdateReceiveDTO(req.body)
    const result = await ReceiveService.update(String(id), dto)

    const response = new ReceiveResponseDTO(result)
    return res.json({ success: true, data: response })
  })

  /**
   * POST /api/inventory/receives/:id/items
   * Agregar item a recepción
   */
  addItem = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const dto = new CreateReceiveItemDTO(req.body)
    const result = await ReceiveService.addItem(String(id), dto)

    const response = new ReceiveItemResponseDTO(result)
    return res
      .status(201)
      .json({ success: true, message: 'Item agregado', data: response })
  })

  /**
   * GET /api/inventory/receives/:id/items
   * Obtener items de una recepción
   */
  getItems = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const items = await ReceiveService.getItems(String(id))

    const response = items.map((item) => new ReceiveItemResponseDTO(item))
    return res.json({ success: true, data: response })
  })

  /**
   * DELETE /api/inventory/receives/:id
   * Eliminar recepción
   */
  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const result = await ReceiveService.delete(String(id))

    return res.json({ success: true, data: result })
  })
}

export { ReceiveController }
