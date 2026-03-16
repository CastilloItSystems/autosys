// backend/src/features/inventory/transfers/transfers.controller.ts

import { Request, Response } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import TransfersService from './transfers.service.js'
import {
  CreateTransferDTO,
  UpdateTransferDTO,
  RejectTransferDTO,
  TransferResponseDTO,
  TransferListResponseDTO,
} from './transfers.dto.js'
import { ITransferFilters } from './transfers.interface.js'

function getEmpresaId(req: Request): string {
  if (!req.empresaId) throw new Error('empresaId not set by middleware')
  return req.empresaId
}

function getUserId(req: Request): string {
  return req.user?.userId ?? 'system'
}

export class TransfersController {
  /**
   * GET /api/inventory/transfers
   */
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
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
      empresaId,
      req.prisma
    )

    const items = result.data.map((t) => new TransferListResponseDTO(t))

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
    const empresaId = getEmpresaId(req)
    const transfer = await TransfersService.findById(
      req.params.id as string,
      empresaId,
      req.prisma
    )
    return ApiResponse.success(res, new TransferResponseDTO(transfer))
  })

  /**
   * POST /api/inventory/transfers
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const transfer = await TransfersService.create(
      new CreateTransferDTO(req.body) as any,
      getUserId(req),
      empresaId,
      req.prisma
    )
    return ApiResponse.created(res, new TransferResponseDTO(transfer))
  })

  /**
   * PUT /api/inventory/transfers/:id
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const transfer = await TransfersService.update(
      req.params.id as string,
      new UpdateTransferDTO(req.body),
      getUserId(req),
      empresaId,
      req.prisma
    )
    return ApiResponse.success(res, new TransferResponseDTO(transfer))
  })

  /**
   * PATCH /api/inventory/transfers/:id/submit
   */
  submit = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const transfer = await TransfersService.submitForApproval(
      req.params.id as string,
      getUserId(req),
      empresaId,
      req.prisma
    )
    return ApiResponse.success(res, new TransferResponseDTO(transfer))
  })

  /**
   * PATCH /api/inventory/transfers/:id/approve
   */
  approve = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const transfer = await TransfersService.approve(
      req.params.id as string,
      getUserId(req),
      empresaId,
      req.prisma
    )
    return ApiResponse.success(res, new TransferResponseDTO(transfer))
  })

  /**
   * PATCH /api/inventory/transfers/:id/reject
   */
  reject = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const transfer = await TransfersService.reject(
      req.params.id as string,
      new RejectTransferDTO(req.body),
      getUserId(req),
      empresaId,
      req.prisma
    )
    return ApiResponse.success(res, new TransferResponseDTO(transfer))
  })

  /**
   * PATCH /api/inventory/transfers/:id/send
   * APPROVED → IN_TRANSIT
   */
  send = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const transfer = await TransfersService.send(
      req.params.id as string,
      getUserId(req),
      empresaId,
      req.prisma
    )
    return ApiResponse.success(res, new TransferResponseDTO(transfer))
  })

  /**
   * PATCH /api/inventory/transfers/:id/receive
   * IN_TRANSIT → RECEIVED
   */
  receive = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const transfer = await TransfersService.receive(
      req.params.id as string,
      getUserId(req),
      empresaId,
      req.prisma
    )
    return ApiResponse.success(res, new TransferResponseDTO(transfer))
  })

  /**
   * PATCH /api/inventory/transfers/:id/cancel
   */
  cancel = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const transfer = await TransfersService.cancel(
      req.params.id as string,
      getUserId(req),
      empresaId,
      req.prisma
    )
    return ApiResponse.success(res, new TransferResponseDTO(transfer))
  })

  /**
   * DELETE /api/inventory/transfers/:id
   */
  remove = asyncHandler(async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    await TransfersService.delete(
      req.params.id as string,
      getUserId(req),
      empresaId,
      req.prisma
    )
    return ApiResponse.noContent(res)
  })
}

export default new TransfersController()
