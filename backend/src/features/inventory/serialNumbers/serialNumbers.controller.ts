// backend/src/features/inventory/serialNumbers/serialNumbers.controller.ts

import { Request, Response } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware'
import { ApiResponse } from '../../../shared/utils/apiResponse'
import SerialNumbersService from './serialNumbers.service'
import {
  CreateSerialNumberDTO,
  UpdateSerialNumberDTO,
  AssignSerialDTO,
  SerialNumberResponseDTO,
  SerialNumberListResponseDTO,
} from './serialNumbers.dto'
import { ISerialNumberFilters } from './serialNumbers.interface'

export class SerialNumbersController {
  /**
   * GET /api/inventory/serial-numbers
   * Get all serial numbers with pagination
   */
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 20,
      itemId,
      serialNumber,
      warehouseId,
      status,
    } = req.query

    const filters: ISerialNumberFilters = {}
    if (itemId) filters.itemId = itemId as string
    if (serialNumber) filters.serialNumber = serialNumber as string
    if (warehouseId) filters.warehouseId = warehouseId as string
    if (status) filters.status = status as any

    const result = await SerialNumbersService.findAll(
      filters,
      Number(page),
      Number(limit),
      req.prisma || undefined
    )

    const items = result.data.map(
      (serial) => new SerialNumberListResponseDTO(serial)
    )

    return ApiResponse.paginated(
      res,
      items,
      result.page,
      result.limit,
      result.total,
      'Serial numbers retrieved successfully'
    )
  })

  /**
   * GET /api/inventory/serial-numbers/:id
   * Get serial number by ID
   */
  getOne = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const serial = await SerialNumbersService.findById(id)
    const dto = new SerialNumberResponseDTO(serial)
    return ApiResponse.success(res, dto, 'Serial number retrieved successfully')
  })

  /**
   * GET /api/inventory/serial-numbers/search/:serialNumber
   * Get serial number by serial number string
   */
  getBySerialNumber = asyncHandler(async (req: Request, res: Response) => {
    const { serialNumber } = req.params
    const serial = await SerialNumbersService.findBySerialNumber(serialNumber)
    const dto = new SerialNumberResponseDTO(serial)
    return ApiResponse.success(res, dto, 'Serial number retrieved successfully')
  })

  /**
   * GET /api/inventory/serial-numbers/item/:itemId
   * Get serial numbers by item ID
   */
  getByItemId = asyncHandler(async (req: Request, res: Response) => {
    const { itemId } = req.params
    const serials = await SerialNumbersService.findByItemId(itemId)
    const dtos = serials.map((s) => new SerialNumberListResponseDTO(s))
    return ApiResponse.success(
      res,
      dtos,
      'Serial numbers retrieved successfully'
    )
  })

  /**
   * GET /api/inventory/serial-numbers/warehouse/:warehouseId
   * Get serial numbers by warehouse ID
   */
  getByWarehouseId = asyncHandler(async (req: Request, res: Response) => {
    const { warehouseId } = req.params
    const serials = await SerialNumbersService.findByWarehouseId(warehouseId)
    const dtos = serials.map((s) => new SerialNumberListResponseDTO(s))
    return ApiResponse.success(
      res,
      dtos,
      'Serial numbers retrieved successfully'
    )
  })

  /**
   * GET /api/inventory/serial-numbers/status/:status
   *  Get serial numbers by status
   */
  getByStatus = asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.params
    const serials = await SerialNumbersService.findByStatus(status as any)
    const dtos = serials.map((s) => new SerialNumberListResponseDTO(s))
    return ApiResponse.success(
      res,
      dtos,
      'Serial numbers retrieved successfully'
    )
  })

  /**
   * POST /api/inventory/serial-numbers
   * Create new serial number
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const createDTO = new CreateSerialNumberDTO(req.body)
    const userId = (req as any).user?.id || 'system'
    const serial = await SerialNumbersService.create(createDTO, userId)
    const dto = new SerialNumberResponseDTO(serial)
    return ApiResponse.created(res, dto, 'Serial number created successfully')
  })

  /**
   * PUT /api/inventory/serial-numbers/:id
   * Update serial number
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const updateDTO = new UpdateSerialNumberDTO(req.body)
    const userId = (req as any).user?.id || 'system'
    const serial = await SerialNumbersService.update(id, updateDTO, userId)
    const dto = new SerialNumberResponseDTO(serial)
    return ApiResponse.success(res, dto, 'Serial number updated successfully')
  })

  /**
   * PATCH /api/inventory/serial-numbers/:id/assign
   * Assign serial to warehouse
   */
  assignToWarehouse = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const assignDTO = new AssignSerialDTO(req.body)
    const userId = (req as any).user?.id || 'system'
    const serial = await SerialNumbersService.assignToWarehouse(
      id,
      assignDTO.warehouseId,
      userId
    )
    const dto = new SerialNumberResponseDTO(serial)
    return ApiResponse.success(res, dto, 'Serial number assigned successfully')
  })

  /**
   * DELETE /api/inventory/serial-numbers/:id
   * Delete serial number
   */
  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    await SerialNumbersService.delete(id)
    return ApiResponse.success(res, null, 'Serial number deleted successfully')
  })
}

export default new SerialNumbersController()
