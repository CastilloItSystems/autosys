// backend/src/features/inventory/entryNotes/entryNotes.controller.ts

import { Request, Response } from 'express'
import { EntryNoteService } from './entryNotes.service'
import {
  CreateEntryNoteDTO,
  UpdateEntryNoteDTO,
  CreateEntryNoteItemDTO,
  EntryNoteResponseDTO,
  EntryNoteItemResponseDTO,
} from './entryNotes.dto'
import { IEntryNoteFilters } from './entryNotes.interface'
import { ApiResponse } from '../../../shared/utils/ApiResponse'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware'
import { INVENTORY_MESSAGES } from '../shared/constants/messages'

const entryNoteService = new EntryNoteService()

export class EntryNoteController {
  /**
   * GET /api/inventory/entry-notes
   * Obtener todas las notas de entrada con paginación
   */
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const {
      page,
      limit,
      type,
      status,
      purchaseOrderId,
      warehouseId,
      receivedBy,
      receivedFrom,
      receivedTo,
      sortBy,
      sortOrder,
    } = req.query

    const filters: IEntryNoteFilters = {}
    if (type) filters.type = type as any
    if (status) filters.status = status as any
    if (purchaseOrderId) filters.purchaseOrderId = purchaseOrderId as string
    if (warehouseId) filters.warehouseId = warehouseId as string
    if (receivedBy) filters.receivedBy = receivedBy as string
    if (receivedFrom) filters.receivedFrom = new Date(receivedFrom as string)
    if (receivedTo) filters.receivedTo = new Date(receivedTo as string)
    filters.page = Number(page) || 1
    filters.limit = Number(limit) || 20
    if (sortBy) filters.sortBy = sortBy as string
    if (sortOrder)
      filters.sortOrder = (sortOrder as string).toLowerCase() as 'asc' | 'desc'

    const result = await entryNoteService.getEntryNotes(filters)
    const entryNotes = result.entryNotes.map(
      (en) => new EntryNoteResponseDTO(en)
    )

    return ApiResponse.paginated(
      res,
      entryNotes,
      result.page,
      result.limit,
      result.total,
      INVENTORY_MESSAGES.entryNote.listed
    )
  })

  /**
   * GET /api/inventory/entry-notes/:id
   * Obtener una nota de entrada por ID
   */
  getOne = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { includeItems = 'true' } = req.query

    const entryNote = await entryNoteService.getEntryNoteById(
      String(id),
      includeItems === 'true'
    )

    const response = new EntryNoteResponseDTO(entryNote)
    return ApiResponse.success(
      res,
      response,
      INVENTORY_MESSAGES.entryNote.retrieved
    )
  })

  /**
   * POST /api/inventory/entry-notes
   * Crear nueva nota de entrada
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id
    const dto = new CreateEntryNoteDTO(req.body)
    const result = await entryNoteService.createEntryNote(dto, userId)

    const response = new EntryNoteResponseDTO(result)
    return ApiResponse.created(
      res,
      response,
      INVENTORY_MESSAGES.entryNote.created
    )
  })

  /**
   * PUT /api/inventory/entry-notes/:id
   * Actualizar nota de entrada
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const dto = new UpdateEntryNoteDTO(req.body)
    const result = await entryNoteService.updateEntryNote(String(id), dto)

    const response = new EntryNoteResponseDTO(result)
    return ApiResponse.success(
      res,
      response,
      INVENTORY_MESSAGES.entryNote.updated
    )
  })

  /**
   * POST /api/inventory/entry-notes/:id/items
   * Agregar item a nota de entrada
   */
  addItem = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const dto = new CreateEntryNoteItemDTO(req.body)
    const result = await entryNoteService.addItem(String(id), dto)

    const response = new EntryNoteItemResponseDTO(result)
    return ApiResponse.created(
      res,
      response,
      INVENTORY_MESSAGES.entryNote.itemAdded
    )
  })

  /**
   * GET /api/inventory/entry-notes/:id/items
   * Obtener items de una nota de entrada
   */
  getItems = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const items = await entryNoteService.getItems(String(id))

    const response = items.map((item) => new EntryNoteItemResponseDTO(item))
    return ApiResponse.success(
      res,
      response,
      INVENTORY_MESSAGES.entryNote.itemsRetrieved
    )
  })

  /**
   * DELETE /api/inventory/entry-notes/:id
   * Eliminar nota de entrada
   */
  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    await entryNoteService.deleteEntryNote(String(id))

    return ApiResponse.success(res, null, INVENTORY_MESSAGES.entryNote.deleted)
  })

  /**
   * POST /api/inventory/entry-notes/:id/start
   * Iniciar procesamiento (PENDING → IN_PROGRESS)
   */
  start = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const userId = (req as any).user?.id
    const result = await entryNoteService.startEntryNote(String(id), userId)

    const response = new EntryNoteResponseDTO(result)
    return ApiResponse.success(
      res,
      response,
      'Nota de entrada iniciada exitosamente'
    )
  })

  /**
   * POST /api/inventory/entry-notes/:id/complete
   * Completar nota de entrada (IN_PROGRESS → COMPLETED) + actualizar stock
   */
  complete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const userId = (req as any).user?.id
    const result = await entryNoteService.completeEntryNote(String(id), userId)

    const response = new EntryNoteResponseDTO(result)
    return ApiResponse.success(
      res,
      response,
      'Nota de entrada completada exitosamente'
    )
  })

  /**
   * POST /api/inventory/entry-notes/:id/cancel
   * Cancelar nota de entrada
   */
  cancel = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const userId = (req as any).user?.id
    const result = await entryNoteService.cancelEntryNote(String(id), userId)

    const response = new EntryNoteResponseDTO(result)
    return ApiResponse.success(
      res,
      response,
      'Nota de entrada cancelada exitosamente'
    )
  })
}

export default new EntryNoteController()
