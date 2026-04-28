// backend/src/features/finance/bankAccounts/bankAccounts.controller.ts

import { Request, Response } from 'express'
import BankAccountService from './bankAccounts.service.js'
import { CreateBankAccountDTO, UpdateBankAccountDTO, BankAccountResponseDTO } from './bankAccounts.dto.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { IBankAccountFilters } from './bankAccounts.interface.js'

function getEmpresaId(req: Request): string {
  if (!req.empresaId) throw new Error('empresaId not set by middleware')
  return req.empresaId
}

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const svc = new BankAccountService(req.prisma)

  const filters: IBankAccountFilters = {
    isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
    currency: req.query.currency as any,
    type: req.query.type as any,
    search: req.query.search as string | undefined,
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Math.min(Number(req.query.limit), 500) : 20,
  }

  const result = await svc.findAll(empresaId, filters)
  return ApiResponse.paginated(res, result.data.map((a) => new BankAccountResponseDTO(a as any)), result.page, result.limit, result.total)
})

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const svc = new BankAccountService(req.prisma)
  const account = await svc.findById(empresaId, String(req.params.id))
  return ApiResponse.success(res, new BankAccountResponseDTO(account as any))
})

export const getBalance = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const svc = new BankAccountService(req.prisma)
  const result = await svc.getBalance(empresaId, String(req.params.id))
  return ApiResponse.success(res, {
    account: new BankAccountResponseDTO(result.account as any),
    balance: result.balance,
    totalIn: result.totalIn,
    totalOut: result.totalOut,
  })
})

export const syncAllBalances = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const svc = new BankAccountService(req.prisma)
  const updated = await svc.syncAllBalances(empresaId)
  return ApiResponse.success(res, { updated })
})

export const create = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const svc = new BankAccountService(req.prisma)
  const dto = new CreateBankAccountDTO(req.body)
  const account = await svc.create(empresaId, dto)
  return ApiResponse.created(res, new BankAccountResponseDTO(account as any))
})

export const update = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const svc = new BankAccountService(req.prisma)
  const dto = new UpdateBankAccountDTO(req.body)
  const account = await svc.update(empresaId, String(req.params.id), dto)
  return ApiResponse.success(res, new BankAccountResponseDTO(account as any))
})
