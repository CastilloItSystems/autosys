// backend/src/features/exchangeRates/exchangeRates.controller.ts

import { Request, Response } from 'express'
import { asyncHandler } from '../../shared/middleware/asyncHandler.middleware.js'
import { ApiResponse } from '../../shared/utils/apiResponse.js'
import { exchangeRateService } from './exchangeRates.service.js'
import { bcvFetchService } from './bcv/bcvFetch.service.js'
import { CreateExchangeRateDTO, UpdateExchangeRateDTO, ExchangeRateResponseDTO } from './exchangeRates.dto.js'
import { CurrencyCode, ExchangeRateSource } from './exchangeRates.interface.js'
import { PrismaClient } from '../../generated/prisma/client.js'

// GET /exchange-rates
export const list = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = req.empresaId!
  const result = await exchangeRateService.findAll(req.validatedQuery as any, empresaId, req.prisma)
  return ApiResponse.paginated(
    res,
    result.data.map((r: any) => new ExchangeRateResponseDTO(r as any)),
    result.page,
    result.limit,
    result.total
  )
})

// GET /exchange-rates/latest
export const getLatest = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = req.empresaId!
  const vq = req.validatedQuery as any
  const fromCurrency = String(vq.fromCurrency) as CurrencyCode
  const toCurrency = String(vq.toCurrency) as CurrencyCode
  const source = vq.source ? String(vq.source) as ExchangeRateSource : undefined
  const rate = await exchangeRateService.getLatestRate(
    empresaId,
    fromCurrency,
    toCurrency,
    source,
    req.prisma
  )
  return ApiResponse.success(res, new ExchangeRateResponseDTO(rate))
})

// GET /exchange-rates/active
export const getActive = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = req.empresaId!
  const rates = await exchangeRateService.getActiveRates(empresaId, req.prisma)
  return ApiResponse.success(res, rates.map((r) => new ExchangeRateResponseDTO(r as any)))
})

// GET /exchange-rates/date/:date
export const getForDate = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = req.empresaId!
  const vp = req.validatedParams as any
  const vq2 = req.validatedQuery as any
  const date = vp.date as string
  const fromCurrency = String(vq2.fromCurrency) as CurrencyCode
  const toCurrency = String(vq2.toCurrency) as CurrencyCode
  const source = vq2.source ? String(vq2.source) as ExchangeRateSource : undefined
  const rate = await exchangeRateService.getRateForDate(
    empresaId,
    date,
    fromCurrency,
    toCurrency,
    source,
    req.prisma
  )
  return ApiResponse.success(res, new ExchangeRateResponseDTO(rate))
})

// GET /exchange-rates/:id
export const getById = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = req.empresaId!
  const id = (req.validatedParams as any).id as string
  const rate = await exchangeRateService.findById(id, empresaId, req.prisma)
  return ApiResponse.success(res, new ExchangeRateResponseDTO(rate))
})

// POST /exchange-rates
export const create = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = req.empresaId!
  const userId = (req as any).userId ?? 'system'
  const dto = new CreateExchangeRateDTO(req.body)
  const rate = await exchangeRateService.create(dto, empresaId, userId, req.prisma)
  return ApiResponse.created(res, new ExchangeRateResponseDTO(rate), 'Tasa de cambio registrada')
})

// POST /exchange-rates/fetch-bcv
export const fetchBcv = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = req.empresaId!
  await bcvFetchService.fetchAndSaveForEmpresa(empresaId, req.prisma as unknown as PrismaClient)
  return ApiResponse.success(res, null, 'Tasas BCV actualizadas correctamente')
})

// PUT /exchange-rates/:id
export const update = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = req.empresaId!
  const userId = (req as any).userId ?? 'system'
  const id = (req.validatedParams as any).id as string
  const dto = new UpdateExchangeRateDTO(req.body)
  const rate = await exchangeRateService.update(id, dto, userId, empresaId, req.prisma)
  return ApiResponse.success(res, new ExchangeRateResponseDTO(rate), 'Tasa de cambio actualizada')
})

// DELETE /exchange-rates/:id
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = req.empresaId!
  const userId = (req as any).userId ?? 'system'
  const id = (req.validatedParams as any).id as string
  await exchangeRateService.delete(id, userId, empresaId, req.prisma)
  return ApiResponse.success(res, null, 'Tasa de cambio eliminada')
})
