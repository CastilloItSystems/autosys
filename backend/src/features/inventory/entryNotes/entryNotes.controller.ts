// backend/src/features/inventory/entryNotes/entryNotes.controller.ts

import { Request, Response } from 'express'
import entryNoteService from './entryNotes.service.js'
import {
  CreateEntryNoteDTO,
  UpdateEntryNoteDTO,
  CreateEntryNoteItemDTO,
  EntryNoteResponseDTO,
  EntryNoteItemResponseDTO,
} from './entryNotes.dto.js'
import {
  IEntryNoteFilters,
  ENTRY_TYPES,
  ENTRY_NOTE_STATUSES,
} from './entryNotes.interface.js'
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

export class EntryNoteController {
  /**
   * GET /api/inventory/entry-notes
   */
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const {
      page,
      limit,
      type,
      status,
      purchaseOrderId,
      warehouseId,
      catalogSupplierId,
      receivedBy,
      receivedFrom,
      receivedTo,
      sortBy,
      sortOrder,
      search,
    } = req.query

    const filters: IEntryNoteFilters = {}
    if (type && ENTRY_TYPES.includes(type as never)) filters.type = type as any
    if (status && ENTRY_NOTE_STATUSES.includes(status as never))
      filters.status = status as any
    if (purchaseOrderId) filters.purchaseOrderId = String(purchaseOrderId)
    if (warehouseId) filters.warehouseId = String(warehouseId)
    if (catalogSupplierId) filters.catalogSupplierId = String(catalogSupplierId)
    if (receivedBy) filters.receivedBy = String(receivedBy)
    if (receivedFrom) filters.receivedFrom = new Date(String(receivedFrom))
    if (receivedTo) filters.receivedTo = new Date(String(receivedTo))
    if (search) filters.search = String(search)
    filters.page = Number(page) || 1
    filters.limit = parseLimit(limit, 20)
    if (sortBy) filters.sortBy = String(sortBy)
    if (sortOrder) filters.sortOrder = sortOrder === 'asc' ? 'asc' : 'desc'

    const result = await entryNoteService.getEntryNotes(
      filters,
      empresaId,
      req.prisma
    )
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
   */
  getOne = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const includeItems = req.query.includeItems !== 'false'

    const entryNote = await entryNoteService.getEntryNoteById(
      id,
      empresaId,
      includeItems,
      req.prisma
    )

    return ApiResponse.success(
      res,
      new EntryNoteResponseDTO(entryNote),
      INVENTORY_MESSAGES.entryNote.retrieved
    )
  })

  /**
   * POST /api/inventory/entry-notes
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId
    const dto = new CreateEntryNoteDTO(req.body)

    const result = await entryNoteService.createEntryNote(
      dto,
      empresaId,
      userId,
      req.prisma
    )

    return ApiResponse.created(
      res,
      new EntryNoteResponseDTO(result),
      INVENTORY_MESSAGES.entryNote.created
    )
  })

  /**
   * PUT /api/inventory/entry-notes/:id
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const dto = new UpdateEntryNoteDTO(req.body)

    const result = await entryNoteService.updateEntryNote(
      id,
      dto,
      empresaId,
      req.prisma
    )

    return ApiResponse.success(
      res,
      new EntryNoteResponseDTO(result),
      INVENTORY_MESSAGES.entryNote.updated
    )
  })

  /**
   * POST /api/inventory/entry-notes/:id/items
   */
  addItem = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }
    const dto = new CreateEntryNoteItemDTO(req.body)

    const result = await entryNoteService.addItem(
      id,
      dto,
      empresaId,
      req.prisma
    )

    return ApiResponse.created(
      res,
      new EntryNoteItemResponseDTO(result),
      INVENTORY_MESSAGES.entryNote.itemAdded
    )
  })

  /**
   * GET /api/inventory/entry-notes/:id/items
   */
  getItems = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }

    const items = await entryNoteService.getItems(id, empresaId, req.prisma)

    return ApiResponse.success(
      res,
      items.map((item) => new EntryNoteItemResponseDTO(item)),
      INVENTORY_MESSAGES.entryNote.itemsRetrieved
    )
  })

  /**
   * DELETE /api/inventory/entry-notes/:id
   */
  delete = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const { id } = req.params as { id: string }

    await entryNoteService.deleteEntryNote(id, empresaId, req.prisma)

    return ApiResponse.success(res, null, INVENTORY_MESSAGES.entryNote.deleted)
  })

  /**
   * POST /api/inventory/entry-notes/:id/start
   */
  start = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId
    const { id } = req.params as { id: string }

    const result = await entryNoteService.startEntryNote(
      id,
      empresaId,
      userId,
      req.prisma
    )

    return ApiResponse.success(
      res,
      new EntryNoteResponseDTO(result),
      'Nota de entrada iniciada exitosamente'
    )
  })

  /**
   * POST /api/inventory/entry-notes/:id/complete
   */
  complete = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId
    const { id } = req.params as { id: string }

    const result = await entryNoteService.completeEntryNote(
      id,
      empresaId,
      userId,
      req.prisma
    )

    return ApiResponse.success(
      res,
      new EntryNoteResponseDTO(result),
      'Nota de entrada completada exitosamente'
    )
  })

  /**
   * POST /api/inventory/entry-notes/:id/cancel
   */
  cancel = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const userId = req.user?.userId
    const { id } = req.params as { id: string }

    const result = await entryNoteService.cancelEntryNote(
      id,
      empresaId,
      userId,
      req.prisma
    )

    return ApiResponse.success(
      res,
      new EntryNoteResponseDTO(result),
      'Nota de entrada cancelada exitosamente'
    )
  })
}

export default new EntryNoteController()
