// backend/src/features/inventory/batches/batches.controller.ts

import { Request, Response } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware'
import { ApiResponse } from '../../../shared/utils/ApiResponse'
import BatchesService from './batches.service'
import {
  CreateBatchDTO,
  UpdateBatchDTO,
  BatchResponseDTO,
  BatchListResponseDTO,
} from './batches.dto'
import { IBatchFilters } from './batches.interface'

export class BatchesController {
  /**
   * GET /api/inventory/batches
   * Get all batches with pagination
   */
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 20,
      itemId,
      batchNumber,
      isActive,
      expiryDateFrom,
      expiryDateTo,
      status,
    } = req.query

    const filters: IBatchFilters = {}
    if (itemId) filters.itemId = itemId as string
    if (batchNumber) filters.batchNumber = batchNumber as string
    if (isActive !== undefined) filters.isActive = isActive === 'true'
    if (expiryDateFrom)
      filters.expiryDateFrom = new Date(expiryDateFrom as string)
    if (expiryDateTo) filters.expiryDateTo = new Date(expiryDateTo as string)
    if (status) filters.status = status as any

    const result = await BatchesService.findAll(
      filters,
      Number(page),
      Number(limit),
      req.prisma || undefined
    )

    const items = result.data.map((batch) => new BatchListResponseDTO(batch))

    ApiResponse.paginated(
      res,
      items,
      result.page,
      result.limit,
      result.total,
      'Batches retrieved successfully'
    )
  })

  /**
   * GET /api/inventory/batches/:id
   * Get batch by ID
   */
  getOne = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const batch = await BatchesService.findById(id)
    const dto = new BatchResponseDTO(batch)
    ApiResponse.success(res, dto, 'Batch retrieved successfully')
  })

  /**
   * GET /api/inventory/batches/item/:itemId
   * Get batches by item ID
   */
  getByItemId = asyncHandler(async (req: Request, res: Response) => {
    const { itemId } = req.params as { itemId: string }
    const batches = await BatchesService.findByItemId(itemId)
    const dtos = batches.map((batch) => new BatchListResponseDTO(batch))
    ApiResponse.success(res, dtos, 'Batches retrieved successfully')
  })

  /**
   * POST /api/inventory/batches
   * Create new batch
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const createDTO = new CreateBatchDTO(req.body)
    const userId = (req as any).user?.id || 'system'
    const batch = await BatchesService.create(createDTO, userId)
    const dto = new BatchResponseDTO(batch)
    ApiResponse.created(res, dto, 'Batch created successfully')
  })

  /**
   * PUT /api/inventory/batches/:id
   * Update batch
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const updateDTO = new UpdateBatchDTO(req.body)
    const userId = (req as any).user?.id || 'system'
    const batch = await BatchesService.update(id, updateDTO, userId)
    const dto = new BatchResponseDTO(batch)
    ApiResponse.success(res, dto, 'Batch updated successfully')
  })

  /**
   * DELETE /api/inventory/batches/:id
   * Delete batch
   */
  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    await BatchesService.delete(id)
    ApiResponse.success(
      res,
      { message: 'Batch deleted successfully' },
      'Batch deleted'
    )
  })

  /**
   * PATCH /api/inventory/batches/:id/deactivate
   * Deactivate batch
   */
  deactivate = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const userId = (req as any).user?.id || 'system'
    const batch = await BatchesService.deactivate(id, userId)
    const dto = new BatchResponseDTO(batch)
    ApiResponse.success(res, dto, 'Batch deactivated successfully')
  })
}

export default new BatchesController()
