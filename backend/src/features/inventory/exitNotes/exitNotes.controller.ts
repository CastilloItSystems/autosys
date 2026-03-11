import { Request, Response } from 'express'
import { ExitNotesService } from './exitNotes.service'
import {
  CreateExitNoteDTO,
  UpdateExitNoteDTO,
  ExitNoteResponseDTO,
} from './exitNotes.dto'
import { ApiResponse } from '../../../shared/utils/apiResponse'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware'
import { ExitNoteStatus, ExitNoteType } from './exitNotes.interface'

const exitNotesService = ExitNotesService.getInstance()

export class ExitNotesController {
  /**
   * GET /api/inventory/exit-notes
   * Obtener todas las notas de salida con filtros
   */
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const {
      type,
      status,
      warehouseId,
      recipientId,
      startDate,
      endDate,
      page,
      limit,
      search,
    } = req.query

    const filters: any = {}
    if (type) filters.type = type as ExitNoteType
    if (status) filters.status = status as ExitNoteStatus
    if (warehouseId) filters.warehouseId = warehouseId as string
    if (recipientId) filters.recipientId = recipientId as string
    if (startDate) filters.startDate = new Date(startDate as string)
    if (endDate) filters.endDate = new Date(endDate as string)
    // Add search if implemented in service, currently service doesn't seem to support generic 'search' param in filters object directly based on previous read, but I'll leave it out or map it if service supports it.
    // Based on previous read of service.findAll, it supports specific fields. I'll stick to those.

    const result = await exitNotesService.findAll(
      filters,
      Number(page) || 1,
      Number(limit) || 20
    )

    const items = result.data.map((note) => new ExitNoteResponseDTO(note))

    return ApiResponse.paginated(
      res,
      items,
      Number(page) || 1,
      Number(limit) || 20,
      result.total,
      'Notas de salida obtenidas exitosamente'
    )
  })

  /**
   * GET /api/inventory/exit-notes/:id
   * Obtener nota de salida por ID
   */
  getOne = asyncHandler(async (req: Request, res: Response) => {
    let { id } = req.params
    if (Array.isArray(id)) id = id[0]
    if (!id) return ApiResponse.notFound(res, 'Nota de salida no encontrada')

    const exitNote = await exitNotesService.findById(id)
    if (!exitNote) {
      return ApiResponse.notFound(res, 'Nota de salida no encontrada')
    }

    const response = new ExitNoteResponseDTO(exitNote)
    return ApiResponse.success(
      res,
      response,
      'Nota de salida obtenida exitosamente'
    )
  })

  /**
   * GET /api/inventory/exit-notes/number/:exitNoteNumber
   * Obtener nota de salida por número
   */
  getByNumber = asyncHandler(async (req: Request, res: Response) => {
    let { exitNoteNumber } = req.params
    if (Array.isArray(exitNoteNumber)) exitNoteNumber = exitNoteNumber[0]
    if (!exitNoteNumber)
      return ApiResponse.badRequest(res, 'Número de nota de salida requerido')

    const exitNote = await exitNotesService.findByNumber(exitNoteNumber)
    if (!exitNote) {
      return ApiResponse.notFound(res, 'Nota de salida no encontrada')
    }

    const response = new ExitNoteResponseDTO(exitNote)
    return ApiResponse.success(
      res,
      response,
      'Nota de salida obtenida exitosamente'
    )
  })

  /**
   * GET /api/inventory/exit-notes/warehouse/:warehouseId
   * Obtener notas de salida por almacén
   */
  getByWarehouse = asyncHandler(async (req: Request, res: Response) => {
    const { warehouseId } = req.params
    const { page, limit } = req.query

    const result = await exitNotesService.findAll(
      { warehouseId },
      Number(page) || 1,
      Number(limit) || 20
    )

    const items = result.data.map((note) => new ExitNoteResponseDTO(note))
    return ApiResponse.paginated(
      res,
      items,
      Number(page) || 1,
      Number(limit) || 20,
      result.total,
      'Notas de salida obtenidas exitosamente'
    )
  })

  /**
   * GET /api/inventory/exit-notes/type/:type
   * Obtener notas de salida por tipo
   */
  getByType = asyncHandler(async (req: Request, res: Response) => {
    const { type } = req.params
    const { page, limit } = req.query

    const result = await exitNotesService.findAll(
      { type: type as ExitNoteType },
      Number(page) || 1,
      Number(limit) || 20
    )

    const items = result.data.map((note) => new ExitNoteResponseDTO(note))
    return ApiResponse.paginated(
      res,
      items,
      Number(page) || 1,
      Number(limit) || 20,
      result.total,
      'Notas de salida obtenidas exitosamente'
    )
  })

  /**
   * GET /api/inventory/exit-notes/status/:status
   * Obtener notas de salida por estado
   */
  getByStatus = asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.params
    const { page, limit } = req.query

    const result = await exitNotesService.findAll(
      { status: status as ExitNoteStatus },
      Number(page) || 1,
      Number(limit) || 20
    )

    const items = result.data.map((note) => new ExitNoteResponseDTO(note))
    return ApiResponse.paginated(
      res,
      items,
      Number(page) || 1,
      Number(limit) || 20,
      result.total,
      'Notas de salida obtenidas exitosamente'
    )
  })

  /**
   * POST /api/inventory/exit-notes
   * Crear nueva nota de salida
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const dto = new CreateExitNoteDTO(req.body)
    const userId = req.user?.userId || (req as any).user?.id

    const exitNote = await exitNotesService.create(dto, userId)
    const response = new ExitNoteResponseDTO(exitNote)

    return ApiResponse.created(
      res,
      response,
      'Nota de salida creada exitosamente'
    )
  })

  /**
   * PUT /api/inventory/exit-notes/:id
   * Actualizar nota de salida (solo PENDING)
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    let { id } = req.params
    if (Array.isArray(id)) id = id[0]
    if (!id) return ApiResponse.notFound(res, 'Nota de salida no encontrada')
    const dto = new UpdateExitNoteDTO(req.body)

    const exitNote = await exitNotesService.update(id, dto)
    const response = new ExitNoteResponseDTO(exitNote)

    return ApiResponse.success(
      res,
      response,
      'Nota de salida actualizada exitosamente'
    )
  })

  /**
   * PATCH /api/inventory/exit-notes/:id/prepare
   * Iniciar preparación
   */
  startPreparing = asyncHandler(async (req: Request, res: Response) => {
    let { id } = req.params
    if (Array.isArray(id)) id = id[0]
    if (!id) return ApiResponse.notFound(res, 'Nota de salida no encontrada')
    const userId = req.user?.userId || (req as any).user?.id

    const exitNote = await exitNotesService.startPreparing(id, userId)
    const response = new ExitNoteResponseDTO(exitNote)

    return ApiResponse.success(
      res,
      response,
      'Preparación iniciada exitosamente'
    )
  })

  /**
   * PATCH /api/inventory/exit-notes/:id/ready
   * Marcar como listo
   */
  markAsReady = asyncHandler(async (req: Request, res: Response) => {
    let { id } = req.params
    if (Array.isArray(id)) id = id[0]
    if (!id) return ApiResponse.notFound(res, 'Nota de salida no encontrada')
    const userId = req.user?.userId || (req as any).user?.id

    const exitNote = await exitNotesService.markAsReady(id, userId)
    const response = new ExitNoteResponseDTO(exitNote)

    return ApiResponse.success(
      res,
      response,
      'Nota de salida marcada como lista'
    )
  })

  /**
   * PATCH /api/inventory/exit-notes/:id/deliver
   * Registrar entrega
   */
  deliver = asyncHandler(async (req: Request, res: Response) => {
    let { id } = req.params
    if (Array.isArray(id)) id = id[0]
    if (!id) return ApiResponse.notFound(res, 'Nota de salida no encontrada')
    const userId = req.user?.userId || (req as any).user?.id

    const exitNote = await exitNotesService.deliver(id, userId)
    const response = new ExitNoteResponseDTO(exitNote)

    return ApiResponse.success(res, response, 'Entrega registrada exitosamente')
  })

  /**
   * POST /api/inventory/exit-notes/:id/cancel
   * Cancelar nota de salida
   */
  cancel = asyncHandler(async (req: Request, res: Response) => {
    let { id } = req.params
    if (Array.isArray(id)) id = id[0]
    if (!id) return ApiResponse.notFound(res, 'Nota de salida no encontrada')
    const { reason } = req.body
    const userId = req.user?.userId || (req as any).user?.id

    const exitNote = await exitNotesService.cancel(id, userId, reason)
    const response = new ExitNoteResponseDTO(exitNote)

    return ApiResponse.success(
      res,
      response,
      'Nota de salida cancelada exitosamente'
    )
  })

  /**
   * GET /api/inventory/exit-notes/:id/status
   * Get exit note status info
   */
  getStatusInfo = asyncHandler(async (req: Request, res: Response) => {
    let { id } = req.params
    if (Array.isArray(id)) id = id[0]
    if (!id) return ApiResponse.notFound(res, 'Nota de salida no encontrada')

    const statusInfo = await exitNotesService.getStatusInfo(id)

    return ApiResponse.success(
      res,
      statusInfo,
      'Exit note status info retrieved'
    )
  })

  /**
   * GET /api/inventory/exit-notes/:id/summary
   * Get exit note summary
   */
  getSummary = asyncHandler(async (req: Request, res: Response) => {
    let { id } = req.params
    if (Array.isArray(id)) id = id[0]
    if (!id) return ApiResponse.notFound(res, 'Nota de salida no encontrada')

    const summary = await exitNotesService.getSummary(id)

    return ApiResponse.success(res, summary, 'Exit note summary retrieved')
  })
}

export default new ExitNotesController()
