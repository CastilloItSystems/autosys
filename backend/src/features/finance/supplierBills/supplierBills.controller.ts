// backend/src/features/finance/supplierBills/supplierBills.controller.ts

import { Request, Response } from 'express'
import SupplierBillService from './supplierBills.service.js'
import {
  CreateSupplierBillDTO,
  RegisterSupplierInvoiceDTO,
  UpdateSupplierBillDTO,
} from './supplierBills.dto.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { ISupplierBillFilters } from './supplierBills.interface.js'

function getEmpresaId(req: Request): string {
  if (!req.empresaId) throw new Error('empresaId not set by middleware')
  return req.empresaId
}

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const svc = new SupplierBillService(req.prisma)
  const filters: ISupplierBillFilters = {
    status: req.query.status as any,
    supplierId: req.query.supplierId as string | undefined,
    purchaseOrderId: req.query.purchaseOrderId as string | undefined,
    from: req.query.from as string | undefined,
    to: req.query.to as string | undefined,
    search: req.query.search as string | undefined,
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Math.min(Number(req.query.limit), 500) : 20,
  }
  const result = await svc.findAll(empresaId, filters)
  return ApiResponse.paginated(res, result.data, result.page, result.limit, result.total)
})

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const bill = await new SupplierBillService(req.prisma).findById(getEmpresaId(req), String(req.params.id))
  return ApiResponse.success(res, bill)
})

export const getAccountsPayable = asyncHandler(async (req: Request, res: Response) => {
  const data = await new SupplierBillService(req.prisma).getAccountsPayable(getEmpresaId(req))
  return ApiResponse.success(res, data)
})

export const getAvailablePurchaseOrders = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await new SupplierBillService(
      req.prisma
    ).getAvailablePurchaseOrders(getEmpresaId(req))
    return ApiResponse.success(res, data)
  }
)

export const create = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const dto = new CreateSupplierBillDTO(req.body)
  const bill = await new SupplierBillService(req.prisma).create(empresaId, dto)
  return ApiResponse.created(res, bill)
})

export const update = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const dto = new UpdateSupplierBillDTO(req.body)
  const bill = await new SupplierBillService(req.prisma).update(empresaId, String(req.params.id), dto)
  return ApiResponse.success(res, bill)
})

export const registerInvoice = asyncHandler(
  async (req: Request, res: Response) => {
    const empresaId = getEmpresaId(req)
    const dto = new RegisterSupplierInvoiceDTO(req.body)
    const bill = await new SupplierBillService(req.prisma).registerInvoice(
      empresaId,
      String(req.params.id),
      dto,
      req.user?.userId
    )
    return ApiResponse.success(res, bill)
  }
)

export const cancel = asyncHandler(async (req: Request, res: Response) => {
  const bill = await new SupplierBillService(req.prisma).cancel(getEmpresaId(req), String(req.params.id))
  return ApiResponse.success(res, bill)
})
