// backend/src/features/finance/supplierPayments/supplierPayments.controller.ts

import { Request, Response } from 'express'
import SupplierPaymentService from './supplierPayments.service.js'
import { CreateSupplierPaymentDTO } from './supplierPayments.dto.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { ISupplierPaymentFilters } from './supplierPayments.interface.js'

function getEmpresaId(req: Request): string {
  if (!req.empresaId) throw new Error('empresaId not set by middleware')
  return req.empresaId
}

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const svc = new SupplierPaymentService(req.prisma)
  const filters: ISupplierPaymentFilters = {
    status: req.query.status as any,
    supplierId: req.query.supplierId as string | undefined,
    supplierBillId: req.query.supplierBillId as string | undefined,
    expenseId: req.query.expenseId as string | undefined,
    from: req.query.from as string | undefined,
    to: req.query.to as string | undefined,
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Math.min(Number(req.query.limit), 500) : 20,
  }
  const result = await svc.findAll(empresaId, filters)
  return ApiResponse.paginated(res, result.data, result.page, result.limit, result.total)
})

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const payment = await new SupplierPaymentService(req.prisma).findById(getEmpresaId(req), String(req.params.id))
  return ApiResponse.success(res, payment)
})

export const create = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const dto = new CreateSupplierPaymentDTO(req.body)
  const userId = req.user?.userId
  const payment = await new SupplierPaymentService(req.prisma).create(empresaId, dto, userId)
  return ApiResponse.created(res, payment)
})

export const cancel = asyncHandler(async (req: Request, res: Response) => {
  const payment = await new SupplierPaymentService(req.prisma).cancel(getEmpresaId(req), String(req.params.id))
  return ApiResponse.success(res, payment)
})
