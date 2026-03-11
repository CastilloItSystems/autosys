// backend/src/features/inventory/transfers/transfers.controller.ts

import { Request, Response } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware'
import { ApiResponse } from '../../../shared/utils/apiResponse'
import TransfersService from './transfers.service'
import {
  CreateTransferDTO,
  UpdateTransferDTO,
  RejectTransferDTO,
  TransferResponseDTO,
  TransferListResponseDTO,
} from './transfers.dto'
import { ITransferFilters } from './transfers.interface'

export class TransfersController {
  /**
   * GET /api/inventory/transfers
   */
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 20,
      fromWarehouseId,
      toWarehouseId,
      status,
      search,
      createdFrom,
      createdTo,
    } = req.query

    const filters: ITransferFilters = {}
    if (fromWarehouseId) filters.fromWarehouseId = fromWarehouseId as string
    if (toWarehouseId) filters.toWarehouseId = toWarehouseId as string
    if (status) filters.status = status as any
    if (search) filters.search = search as string
    if (createdFrom) filters.createdFrom = new Date(createdFrom as string)
    if (createdTo) filters.createdTo = new Date(createdTo as string)

    const result = await TransfersService.findAll(
      filters,
      Number(page),
      Number(limit),
      req.prisma || undefined
    )

    const items = result.data.map(
      (transfer) => new TransferListResponseDTO(transfer)
    )

    return ApiResponse.paginated(
      res,
      items,
      result.page,
      result.limit,
      result.total
    )
  })

  /**
   * GET /api/inventory/transfers/:id
   */
  getOne = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string
    const transfer = await TransfersService.findById(id)
    const dto = new TransferResponseDTO(transfer)
    return ApiResponse.success(res, dto)
  })

  /**
   * POST /api/inventory/transfers
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const createDTO = new CreateTransferDTO(req.body)
    const userId = (req as any).user?.userId || 'system'
    const transfer = await TransfersService.create(createDTO, userId)
    const dto = new TransferResponseDTO(transfer)
    return ApiResponse.created(res, dto)
  })

  /**
   * PUT /api/inventory/transfers/:id
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string
    const updateDTO = new UpdateTransferDTO(req.body)
    const userId = (req as any).user?.userId || 'system'
    const transfer = await TransfersService.update(id, updateDTO, userId)
    const dto = new TransferResponseDTO(transfer)
    return ApiResponse.success(res, dto)
  })

  /**
   * PATCH /api/inventory/transfers/:id/submit
   * Submit for approval (DRAFT → PENDING_APPROVAL)
   */
  submit = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string
    const userId = (req as any).user?.userId || 'system'
    const transfer = await TransfersService.submitForApproval(id, userId)
    const dto = new TransferResponseDTO(transfer)
    return ApiResponse.success(res, dto)
  })

  /**
   * PATCH /api/inventory/transfers/:id/approve
   * Approve transfer (PENDING_APPROVAL → APPROVED)
   */
  approve = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string
    const userId = (req as any).user?.userId || 'system'
    const transfer = await TransfersService.approve(id, userId)
    const dto = new TransferResponseDTO(transfer)
    return ApiResponse.success(res, dto)
  })

  /**
   * PATCH /api/inventory/transfers/:id/reject
   * Reject transfer (PENDING_APPROVAL → REJECTED)
   */
  reject = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string
    const rejectDTO = new RejectTransferDTO(req.body)
    const userId = (req as any).user?.userId || 'system'
    const transfer = await TransfersService.reject(id, rejectDTO, userId)
    const dto = new TransferResponseDTO(transfer)
    return ApiResponse.success(res, dto)
  })

  /**
   * PATCH /api/inventory/transfers/:id/cancel
   */
  cancel = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string
    const userId = (req as any).user?.userId || 'system'
    const transfer = await TransfersService.cancel(id, userId)
    const dto = new TransferResponseDTO(transfer)
    return ApiResponse.success(res, dto)
  })

  /**
   * DELETE /api/inventory/transfers/:id
   * Delete transfer (DRAFT only)
   */
  remove = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string
    const userId = (req as any).user?.userId || 'system'
    await TransfersService.delete(id, userId)
    return ApiResponse.noContent(res)
  })
}

export default new TransfersController()
