// backend/src/features/inventory/returns/returns.controller.ts

import { Request, Response } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware'
import { ApiResponse } from '../../../shared/utils/apiResponse'
import ReturnsService from './returns.service'
import {
  CreateReturnDTO,
  UpdateReturnDTO,
  ReturnResponseDTO,
} from './returns.dto'

export class ReturnsController {
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 20, status, type, warehouseId } = req.query
    const result = await ReturnsService.findAll(
      Number(page),
      Number(limit),
      {
        status: status as any,
        type: type as string,
        warehouseId: warehouseId as string,
      },
      req.prisma || undefined
    )
    return ApiResponse.paginated(
      res,
      result.data,
      Number(page),
      Number(limit),
      result.total
    )
  })

  getOne = asyncHandler(async (req: Request, res: Response) => {
    const ret = await ReturnsService.findById(req.params.id)
    return ApiResponse.success(res, new ReturnResponseDTO(ret))
  })

  create = asyncHandler(async (req: Request, res: Response) => {
    const dto = new CreateReturnDTO(req.body)
    const userId = (req as any).user?.id || 'system'
    const ret = await ReturnsService.create(dto as any, userId)
    return ApiResponse.created(res, new ReturnResponseDTO(ret))
  })

  update = asyncHandler(async (req: Request, res: Response) => {
    const dto = new UpdateReturnDTO(req.body)
    const userId = (req as any).user?.id || 'system'
    const ret = await ReturnsService.update(req.params.id, dto, userId)
    return ApiResponse.success(res, new ReturnResponseDTO(ret))
  })

  approve = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id || 'system'
    const ret = await ReturnsService.approve(req.params.id, userId)
    return ApiResponse.success(res, new ReturnResponseDTO(ret))
  })

  process = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id || 'system'
    const ret = await ReturnsService.process(req.params.id, userId)
    return ApiResponse.success(res, new ReturnResponseDTO(ret))
  })

  reject = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id || 'system'
    const ret = await ReturnsService.reject(req.params.id, userId)
    return ApiResponse.success(res, new ReturnResponseDTO(ret))
  })

  cancel = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id || 'system'
    const ret = await ReturnsService.cancel(req.params.id, userId)
    return ApiResponse.success(res, new ReturnResponseDTO(ret))
  })

  submit = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id || 'system'
    const ret = await ReturnsService.submit(req.params.id, userId)
    return ApiResponse.success(res, new ReturnResponseDTO(ret))
  })
}

export default new ReturnsController()
