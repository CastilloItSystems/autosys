/**
 * Loans Controller - HTTP Request Handlers
 */

import { Request, Response } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware'
import { ApiResponse } from '../../../shared/utils/ApiResponse'
import { BadRequestError } from '../../../shared/utils/ApiError'
import LoansService from './loans.service'
import {
  CreateLoanDTO,
  UpdateLoanDTO,
  ApproveLoanDTO,
  ReturnLoanDTO,
  LoanResponseDTO,
  LoanWithItemsDTO,
} from './loans.dto'
import { returnLoanSchema } from './loans.validation'
import { LoanStatus } from './loans.interface'

const service = LoansService.getInstance()

export const getLoans = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20
  const status = req.query.status as string
  const borrowerName = req.query.borrowerName as string
  const warehouseId = req.query.warehouseId as string

  const filters: any = {}
  if (status) filters.status = status
  if (borrowerName) filters.borrowerName = borrowerName
  if (warehouseId) filters.warehouseId = warehouseId

  const result = await service.findAll(filters, page, limit, undefined, undefined, req.prisma || undefined)

  return ApiResponse.paginated(
    res,
    result.items.map((loan) => LoanResponseDTO.fromEntity(loan)),
    page,
    limit,
    result.total
  )
})

export const getLoanById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const loan = await service.findById(id)

  return ApiResponse.success(res, LoanWithItemsDTO.fromEntity(loan))
})

export const createLoan = asyncHandler(async (req: Request, res: Response) => {
  const dto = new CreateLoanDTO(req.body)
  const loan = await service.create(dto, req.user?.id || 'SYSTEM')

  return ApiResponse.created(res, LoanWithItemsDTO.fromEntity(loan))
})

export const updateLoan = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const dto = new UpdateLoanDTO(req.body)
  const loan = await service.update(id, dto, req.user?.id || 'SYSTEM')

  return ApiResponse.success(res, LoanWithItemsDTO.fromEntity(loan))
})

export const approveLoan = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const approvedBy = req.user?.id || 'SYSTEM'
  const loan = await service.approve(id, approvedBy)

  return ApiResponse.success(res, LoanWithItemsDTO.fromEntity(loan))
})

export const activateLoan = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params
    const loan = await service.activate(id, req.user?.id || 'SYSTEM')

    return ApiResponse.success(res, LoanWithItemsDTO.fromEntity(loan))
  }
)

export const returnLoanItems = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params
    const { items } = req.body

    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestError('Items array is required and must not be empty')
    }

    const loan = await service.returnItems(id, items, req.user?.id || 'SYSTEM')

    return ApiResponse.success(res, LoanWithItemsDTO.fromEntity(loan))
  }
)

export const cancelLoan = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const { reason } = req.body
  const loan = await service.cancel(id, reason)

  return ApiResponse.success(res, LoanWithItemsDTO.fromEntity(loan))
})
