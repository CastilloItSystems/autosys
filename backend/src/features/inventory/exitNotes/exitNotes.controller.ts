// backend/src/features/inventory/exitNotes/exitNotes.controller.ts

import { Request, Response } from 'express'
import exitNotesService from './exitNotes.service.js'
import {
  CreateExitNoteDTO,
  UpdateExitNoteDTO,
  ExitNoteResponseDTO,
} from './exitNotes.dto.js'
import { ExitNoteStatus, ExitNoteType } from './exitNotes.interface.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { INVENTORY_MESSAGES } from '../shared/constants/messages.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getEmpresaId(req: Request): string {
  if (!req.empresaId) throw new Error('empresaId not set by middleware')
  return req.empresaId
}

function parseLimit(raw: unknown, fallback: number): number {
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? Math.min(n, 500) : fallback
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

class ExitNotesController {
  /**
   * GET /api/inventory/exit-notes
   */
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const {
      type,
      status,
      warehouseId,
      recipientId,
      startDate,
      endDate,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    } = req.query

    const filters: {
      type?: ExitNoteType
      status?: ExitNoteStatus
      warehouseId?: string
      recipientId?: string
      startDate?: Date
      endDate?: Date
      search?: string
    } = {}

    if (type && Object.values(ExitNoteType).includes(type as ExitNoteType))
      filters.type = type as ExitNoteType
    if (
      status &&
      Object.values(ExitNoteStatus).includes(status as ExitNoteStatus)
    )
      filters.status = status as ExitNoteStatus
    if (warehouseId) filters.warehouseId = String(warehouseId)
    if (recipientId) filters.recipientId = String(recipientId)
    if (startDate) filters.startDate = new Date(String(startDate))
    if (endDate) filters.endDate = new Date(String(endDate))
    if (search) filters.search = String(search)

    const pageNum = Number(page) || 1
    const limitNum = parseLimit(limit, 20)
    const sortByField = typeof sortBy === 'string' ? sortBy : 'createdAt'
    const sortOrderDir = sortOrder === 'asc' ? 'asc' : 'desc'

    const result = await exitNotesService.findAll(
      filters,
      pageNum,
      limitNum,
      empresaId,
      req.prisma,
      sortByField,
      sortOrderDir
    )
    const items = result.data.map((note) => new ExitNoteResponseDTO(note))

    return ApiResponse.paginated(
      res,
      items,
      pageNum,
      limitNum,
      result.total,
      'Notas de salida obtenidas exitosamente'
    )
  })

  /**
   * GET /api/inventory/exit-notes/:id
   */
  getOne = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }

    const exitNote = await exitNotesService.findById(id, empresaId, req.prisma)

    return ApiResponse.success(
      res,
      new ExitNoteResponseDTO(exitNote),
      'Nota de salida obtenida exitosamente'
    )
  })

  /**
   * GET /api/inventory/exit-notes/number/:exitNoteNumber
   */
  getByNumber = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { exitNoteNumber } = req.params as { exitNoteNumber: string }

    const exitNote = await exitNotesService.findByNumber(
      exitNoteNumber,
      empresaId,
      req.prisma
    )

    return ApiResponse.success(
      res,
      new ExitNoteResponseDTO(exitNote),
      'Nota de salida obtenida exitosamente'
    )
  })

  /**
   * GET /api/inventory/exit-notes/warehouse/:warehouseId
   */
  getByWarehouse = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { warehouseId } = req.params as { warehouseId: string }
    const pageNum = Number(req.query.page) || 1
    const limitNum = parseLimit(req.query.limit, 20)

    const result = await exitNotesService.findAll(
      { warehouseId },
      pageNum,
      limitNum,
      empresaId,
      req.prisma
    )
    const items = result.data.map((note) => new ExitNoteResponseDTO(note))

    return ApiResponse.paginated(
      res,
      items,
      pageNum,
      limitNum,
      result.total,
      'Notas de salida obtenidas exitosamente'
    )
  })

  /**
   * GET /api/inventory/exit-notes/type/:type
   */
  getByType = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { type } = req.params as { type: string }
    const pageNum = Number(req.query.page) || 1
    const limitNum = parseLimit(req.query.limit, 20)

    if (!Object.values(ExitNoteType).includes(type as ExitNoteType)) {
      return ApiResponse.badRequest(res, `Tipo inválido: ${type}`)
    }

    const result = await exitNotesService.findAll(
      { type: type as ExitNoteType },
      pageNum,
      limitNum,
      empresaId,
      req.prisma
    )
    const items = result.data.map((note) => new ExitNoteResponseDTO(note))

    return ApiResponse.paginated(
      res,
      items,
      pageNum,
      limitNum,
      result.total,
      'Notas de salida obtenidas exitosamente'
    )
  })

  /**
   * GET /api/inventory/exit-notes/status/:status
   */
  getByStatus = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { status } = req.params as { status: string }
    const pageNum = Number(req.query.page) || 1
    const limitNum = parseLimit(req.query.limit, 20)

    if (!Object.values(ExitNoteStatus).includes(status as ExitNoteStatus)) {
      return ApiResponse.badRequest(res, `Estado inválido: ${status}`)
    }

    const result = await exitNotesService.findAll(
      { status: status as ExitNoteStatus },
      pageNum,
      limitNum,
      empresaId,
      req.prisma
    )
    const items = result.data.map((note) => new ExitNoteResponseDTO(note))

    return ApiResponse.paginated(
      res,
      items,
      pageNum,
      limitNum,
      result.total,
      'Notas de salida obtenidas exitosamente'
    )
  })

  /**
   * POST /api/inventory/exit-notes
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId
    const dto = new CreateExitNoteDTO(req.body)

    const exitNote = await exitNotesService.create(
      dto,
      empresaId,
      userId,
      req.prisma
    )

    return ApiResponse.created(
      res,
      new ExitNoteResponseDTO(exitNote),
      INVENTORY_MESSAGES.exitNote.created
    )
  })

  /**
   * PUT /api/inventory/exit-notes/:id
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const dto = new UpdateExitNoteDTO(req.body)

    const exitNote = await exitNotesService.update(
      id,
      dto,
      empresaId,
      req.prisma
    )

    return ApiResponse.success(
      res,
      new ExitNoteResponseDTO(exitNote),
      INVENTORY_MESSAGES.exitNote.updated
    )
  })

  /**
   * PATCH /api/inventory/exit-notes/:id/start
   */
  startPreparing = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId
    const { id } = req.params as { id: string }

    const exitNote = await exitNotesService.startPreparing(
      id,
      empresaId,
      userId,
      req.prisma
    )

    return ApiResponse.success(
      res,
      new ExitNoteResponseDTO(exitNote),
      'Preparación iniciada exitosamente'
    )
  })

  /**
   * PATCH /api/inventory/exit-notes/:id/ready
   */
  markAsReady = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId
    const { id } = req.params as { id: string }

    const exitNote = await exitNotesService.markAsReady(
      id,
      empresaId,
      userId,
      req.prisma
    )

    return ApiResponse.success(
      res,
      new ExitNoteResponseDTO(exitNote),
      'Nota de salida marcada como lista'
    )
  })

  /**
   * PATCH /api/inventory/exit-notes/:id/deliver
   */
  deliver = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId
    const { id } = req.params as { id: string }

    const exitNote = await exitNotesService.deliver(
      id,
      empresaId,
      userId,
      req.prisma
    )

    return ApiResponse.success(
      res,
      new ExitNoteResponseDTO(exitNote),
      'Entrega registrada exitosamente'
    )
  })

  /**
   * PATCH /api/inventory/exit-notes/:id/cancel
   */
  cancel = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId
    const { id } = req.params as { id: string }
    const reason = String(req.body.reason ?? '')

    const exitNote = await exitNotesService.cancel(
      id,
      empresaId,
      reason,
      userId,
      req.prisma
    )

    return ApiResponse.success(
      res,
      new ExitNoteResponseDTO(exitNote),
      'Nota de salida cancelada exitosamente'
    )
  })

  /**
   * GET /api/inventory/exit-notes/:id/tracking
   * Timeline de estados: cuándo pasó de PENDING → IN_PROGRESS → READY → DELIVERED
   */
  getTracking = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }

    const exitNote = await exitNotesService.findById(id, empresaId, req.prisma)

    const STATUS_ORDER = [
      ExitNoteStatus.PENDING,
      ExitNoteStatus.IN_PROGRESS,
      ExitNoteStatus.READY,
      ExitNoteStatus.DELIVERED,
    ]

    const timeline: Array<{ status: string; timestamp: Date; by?: string }> = [
      { status: 'PENDING', timestamp: exitNote.createdAt },
    ]
    if (exitNote.reservedAt)
      timeline.push({ status: 'IN_PROGRESS', timestamp: exitNote.reservedAt })
    if (exitNote.preparedAt)
      timeline.push({
        status: 'READY',
        timestamp: exitNote.preparedAt,
        ...(exitNote.preparedBy ? { by: exitNote.preparedBy } : {}),
      })
    if (exitNote.deliveredAt)
      timeline.push({
        status: 'DELIVERED',
        timestamp: exitNote.deliveredAt,
        ...(exitNote.deliveredBy ? { by: exitNote.deliveredBy } : {}),
      })

    const currentIndex = STATUS_ORDER.indexOf(exitNote.status as ExitNoteStatus)
    const progress =
      exitNote.status === ExitNoteStatus.CANCELLED
        ? 0
        : Math.round(((currentIndex + 1) / STATUS_ORDER.length) * 100)

    return ApiResponse.success(
      res,
      {
        id: exitNote.id,
        exitNoteNumber: exitNote.exitNoteNumber,
        currentStatus: exitNote.status,
        progress,
        timeline,
        estimatedDeliveryDate: exitNote.expectedReturnDate,
        actualDeliveryDate: exitNote.deliveredAt,
      },
      'Tracking de nota de salida obtenido'
    )
  })

  /**
   * GET /api/inventory/exit-notes/:id/status
   */
  getStatusInfo = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }

    const statusInfo = await exitNotesService.getStatusInfo(
      id,
      empresaId,
      req.prisma
    )

    return ApiResponse.success(
      res,
      statusInfo,
      'Estado de nota de salida obtenido'
    )
  })

  /**
   * GET /api/inventory/exit-notes/:id/summary
   */
  getSummary = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }

    const summary = await exitNotesService.getSummary(id, empresaId, req.prisma)

    return ApiResponse.success(
      res,
      summary,
      'Resumen de nota de salida obtenido'
    )
  })
}

export default new ExitNotesController()
