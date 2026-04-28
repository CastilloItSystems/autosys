// backend/src/features/finance/expenses/expenses.controller.ts

import { Request, Response } from 'express'
import ExpenseService from './expenses.service.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { IExpenseFilters } from './expenses.interface.js'

type AnyRecord = Record<string, unknown>
const asRecord = (value: unknown): AnyRecord =>
  value != null && typeof value === 'object' && !Array.isArray(value)
    ? (value as AnyRecord)
    : {}

function getEmpresaId(req: Request): string {
  if (!req.empresaId) throw new Error('empresaId not set by middleware')
  return req.empresaId
}

// ── Gastos ────────────────────────────────────────────────────────────────────

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = getEmpresaId(req)
  const filters: IExpenseFilters = {
    status: req.query.status as any,
    category: req.query.category as any,
    supplierId: req.query.supplierId as string | undefined,
    isRecurring: req.query.isRecurring === 'true' ? true : req.query.isRecurring === 'false' ? false : undefined,
    from: req.query.from as string | undefined,
    to: req.query.to as string | undefined,
    search: req.query.search as string | undefined,
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Math.min(Number(req.query.limit), 500) : 20,
  }
  const result = await new ExpenseService(req.prisma).findAll(empresaId, filters)
  return ApiResponse.paginated(res, result.data, result.page, result.limit, result.total)
})

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const expense = await new ExpenseService(req.prisma).findById(getEmpresaId(req), String(req.params.id))
  return ApiResponse.success(res, expense)
})

export const create = asyncHandler(async (req: Request, res: Response) => {
  const r = asRecord(req.body)
  const expense = await new ExpenseService(req.prisma).create(getEmpresaId(req), r as any)
  return ApiResponse.created(res, expense)
})

export const update = asyncHandler(async (req: Request, res: Response) => {
  const r = asRecord(req.body)
  const expense = await new ExpenseService(req.prisma).update(getEmpresaId(req), String(req.params.id), r as any)
  return ApiResponse.success(res, expense)
})

export const cancel = asyncHandler(async (req: Request, res: Response) => {
  const expense = await new ExpenseService(req.prisma).cancel(getEmpresaId(req), String(req.params.id))
  return ApiResponse.success(res, expense)
})

// ── Reglas recurrentes ────────────────────────────────────────────────────────

export const getAllRules = asyncHandler(async (req: Request, res: Response) => {
  const page = req.query.page ? Number(req.query.page) : 1
  const limit = req.query.limit ? Math.min(Number(req.query.limit), 500) : 20
  const result = await new ExpenseService(req.prisma).findAllRules(getEmpresaId(req), page, limit)
  return ApiResponse.paginated(res, result.data, result.page, result.limit, result.total)
})

export const createRule = asyncHandler(async (req: Request, res: Response) => {
  const r = asRecord(req.body)
  const rule = await new ExpenseService(req.prisma).createRule(getEmpresaId(req), r as any)
  return ApiResponse.created(res, rule)
})

export const updateRule = asyncHandler(async (req: Request, res: Response) => {
  const r = asRecord(req.body)
  const rule = await new ExpenseService(req.prisma).updateRule(getEmpresaId(req), String(req.params.id), r as any)
  return ApiResponse.success(res, rule)
})

export const runRecurring = asyncHandler(async (req: Request, res: Response) => {
  const count = await new ExpenseService(req.prisma).generateRecurring(getEmpresaId(req))
  return ApiResponse.success(res, { generated: count })
})
