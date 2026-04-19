// backend/src/features/exchangeRates/exchangeRates.service.ts

import { PrismaClient, Prisma } from '../../generated/prisma/client.js'
import { logger } from '../../shared/utils/logger.js'
import { NotFoundError, ConflictError, BadRequestError } from '../../shared/utils/apiError.js'
import {
  IExchangeRate,
  ICreateExchangeRateInput,
  IUpdateExchangeRateInput,
  IExchangeRateFilters,
  CurrencyCode,
  ExchangeRateSource,
  IBcvRateData,
} from './exchangeRates.interface.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

class ExchangeRateService {
  // ---------------------------------------------------------------------------
  // CREATE
  // ---------------------------------------------------------------------------

  async create(
    data: ICreateExchangeRateInput,
    empresaId: string,
    userId: string,
    db: PrismaClientType
  ): Promise<IExchangeRate> {
    try {
      const record = await (db as PrismaClient).exchangeRate.create({
        data: {
          empresaId,
          fromCurrency: data.fromCurrency as any,
          toCurrency: data.toCurrency as any,
          rate: data.rate,
          rateDate: new Date(data.rateDate),
          source: (data.source as any) ?? 'MANUAL',
          createdBy: userId,
          notes: data.notes ?? null,
        },
      })
      logger.info(`Tasa de cambio creada: ${data.fromCurrency}/${data.toCurrency} = ${data.rate}`, {
        empresaId,
        userId,
        rateDate: data.rateDate,
      })
      return record as unknown as IExchangeRate
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictError(
          `Ya existe una tasa ${data.fromCurrency}/${data.toCurrency} de fuente ${data.source ?? 'MANUAL'} para esa fecha`
        )
      }
      throw error
    }
  }

  // ---------------------------------------------------------------------------
  // READ
  // ---------------------------------------------------------------------------

  async findAll(filters: IExchangeRateFilters, empresaId: string, db: PrismaClientType) {
    const { page = 1, limit = 30, fromCurrency, toCurrency, source, dateFrom, dateTo, isActive } = filters

    const where: any = { empresaId }

    if (fromCurrency) where.fromCurrency = fromCurrency
    if (toCurrency) where.toCurrency = toCurrency
    if (source) where.source = source
    if (isActive !== undefined) where.isActive = isActive
    if (dateFrom || dateTo) {
      where.rateDate = {}
      if (dateFrom) where.rateDate.gte = new Date(dateFrom)
      if (dateTo) where.rateDate.lte = new Date(dateTo)
    }

    const [data, total] = await Promise.all([
      (db as PrismaClient).exchangeRate.findMany({
        where,
        orderBy: [{ rateDate: 'desc' }, { source: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      (db as PrismaClient).exchangeRate.count({ where }),
    ])

    return { data, total, page, limit }
  }

  async findById(id: string, empresaId: string, db: PrismaClientType): Promise<IExchangeRate> {
    const record = await (db as PrismaClient).exchangeRate.findFirst({
      where: { id, empresaId },
    })
    if (!record) throw new NotFoundError('Tasa de cambio no encontrada')
    return record as unknown as IExchangeRate
  }

  // ---------------------------------------------------------------------------
  // LOOKUP
  // ---------------------------------------------------------------------------

  async getLatestRate(
    empresaId: string,
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode,
    source?: ExchangeRateSource,
    db?: PrismaClientType
  ): Promise<IExchangeRate> {
    const prismaDb = db as PrismaClient

    // Prioridad: source específico, luego BCV, luego cualquiera
    const sourcePriority: ExchangeRateSource[] = source
      ? [source]
      : ['BCV', 'MANUAL', 'PARALLEL']

    for (const src of sourcePriority) {
      const record = await prismaDb.exchangeRate.findFirst({
        where: { empresaId, fromCurrency: fromCurrency as any, toCurrency: toCurrency as any, source: src as any, isActive: true },
        orderBy: { rateDate: 'desc' },
      })
      if (record) return record as unknown as IExchangeRate
    }

    throw new NotFoundError(
      `No hay tasa de cambio disponible para ${fromCurrency}/${toCurrency}`
    )
  }

  async getRateForDate(
    empresaId: string,
    date: string,
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode,
    source?: ExchangeRateSource,
    db?: PrismaClientType
  ): Promise<IExchangeRate> {
    const prismaDb = db as PrismaClient
    const targetDate = new Date(date)

    const sourceFilter = source ? { source: source as any } : {}

    // 1. Buscar match exacto
    const exact = await prismaDb.exchangeRate.findFirst({
      where: {
        empresaId,
        fromCurrency: fromCurrency as any,
        toCurrency: toCurrency as any,
        rateDate: targetDate,
        isActive: true,
        ...sourceFilter,
      },
      orderBy: { source: 'asc' }, // BCV antes que MANUAL
    })
    if (exact) return exact as unknown as IExchangeRate

    // 2. Fallback: la más reciente anterior a la fecha
    const fallback = await prismaDb.exchangeRate.findFirst({
      where: {
        empresaId,
        fromCurrency: fromCurrency as any,
        toCurrency: toCurrency as any,
        rateDate: { lte: targetDate },
        isActive: true,
        ...sourceFilter,
      },
      orderBy: [{ rateDate: 'desc' }, { source: 'asc' }],
    })
    if (fallback) return fallback as unknown as IExchangeRate

    throw new NotFoundError(
      `No hay tasa de cambio disponible para ${fromCurrency}/${toCurrency} en la fecha ${date}`
    )
  }

  async getActiveRates(empresaId: string, db: PrismaClientType): Promise<IExchangeRate[]> {
    const pairs: Array<{ from: CurrencyCode; to: CurrencyCode }> = [
      { from: 'USD', to: 'VES' },
      { from: 'EUR', to: 'VES' },
      { from: 'USD', to: 'EUR' },
    ]

    const results = await Promise.allSettled(
      pairs.map((pair) =>
        this.getLatestRate(empresaId, pair.from, pair.to, undefined, db)
      )
    )

    return results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => (r as PromiseFulfilledResult<IExchangeRate>).value)
  }

  // ---------------------------------------------------------------------------
  // UPDATE
  // ---------------------------------------------------------------------------

  async update(
    id: string,
    data: IUpdateExchangeRateInput,
    userId: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IExchangeRate> {
    const existing = await this.findById(id, empresaId, db)

    if (existing.source !== 'MANUAL') {
      throw new BadRequestError('Solo se pueden editar tasas de fuente MANUAL')
    }

    const record = await (db as PrismaClient).exchangeRate.update({
      where: { id },
      data: {
        ...(data.rate !== undefined && { rate: data.rate }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    })

    logger.info(`Tasa de cambio actualizada: ${id}`, { empresaId, userId })
    return record as unknown as IExchangeRate
  }

  // ---------------------------------------------------------------------------
  // DELETE
  // ---------------------------------------------------------------------------

  async delete(id: string, userId: string, empresaId: string, db: PrismaClientType): Promise<void> {
    const existing = await this.findById(id, empresaId, db)

    if (existing.source !== 'MANUAL') {
      throw new BadRequestError('Solo se pueden eliminar tasas de fuente MANUAL')
    }

    await (db as PrismaClient).exchangeRate.delete({ where: { id } })
    logger.info(`Tasa de cambio eliminada: ${id}`, { empresaId, userId })
  }

  // ---------------------------------------------------------------------------
  // BCV SAVE (called by BCV fetch job)
  // ---------------------------------------------------------------------------

  async saveBcvRates(
    empresaId: string,
    rates: Array<{
      fromCurrency: CurrencyCode
      toCurrency: CurrencyCode
      rate: number
      date: Date
    }>,
    db: PrismaClientType
  ): Promise<void> {
    const now = new Date()

    // createMany con skipDuplicates por constraint unique
    await (db as PrismaClient).exchangeRate.createMany({
      data: rates.map((r) => ({
        empresaId,
        fromCurrency: r.fromCurrency as any,
        toCurrency: r.toCurrency as any,
        rate: r.rate,
        rateDate: r.date,
        source: 'BCV' as any,
        fetchedAt: now,
        isActive: true,
      })),
      skipDuplicates: true,
    })

    logger.info(`Tasas BCV guardadas para empresa ${empresaId}`, {
      count: rates.length,
      date: rates[0]?.date,
    })
  }
}

export const exchangeRateService = new ExchangeRateService()
export default exchangeRateService
