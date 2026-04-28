// backend/src/features/finance/cashTransactions/cashTransactions.controller.ts

import { Request, Response } from 'express'
import CashTransactionService from './cashTransactions.service.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'

function getEmpresaId(req: Request): string {
  if (!req.empresaId) throw new Error('empresaId not set by middleware')
  return req.empresaId
}

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const svc = new CashTransactionService(req.prisma)
  const result = await svc.findAll(empresaId, {
    bankAccountId: req.query.bankAccountId as string | undefined,
    from: req.query.from as string | undefined,
    to: req.query.to as string | undefined,
    source: req.query.source as string | undefined,
    type: req.query.type as string | undefined,
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Math.min(Number(req.query.limit), 500) : 50,
  })
  return ApiResponse.paginated(res, result.data, result.page, result.limit, result.total)
})

export const createTransfer = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const svc = new CashTransactionService(req.prisma)
  const { fromAccountId, toAccountId, amount, currency, exchangeRate, description } = req.body
  const result = await svc.createTransfer(empresaId, { fromAccountId, toAccountId, amount: Number(amount), currency, exchangeRate: exchangeRate ? Number(exchangeRate) : undefined, description })
  return ApiResponse.created(res, result)
})

export const createAdjustment = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const svc = new CashTransactionService(req.prisma)
  const { bankAccountId, amount, description, exchangeRate } = req.body
  const result = await svc.createAdjustment(empresaId, { bankAccountId, amount: Number(amount), description, exchangeRate: exchangeRate ? Number(exchangeRate) : undefined })
  return ApiResponse.created(res, result)
})

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const svc = new CashTransactionService(req.prisma)
  const data = await svc.getSummary(
    empresaId,
    req.query.bankAccountId as string | undefined,
    req.query.from as string | undefined,
    req.query.to as string | undefined,
    req.query.convertTo as string | undefined,
  )
  return ApiResponse.success(res, data)
})
