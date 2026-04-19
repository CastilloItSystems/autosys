// backend/src/features/exchangeRates/exchangeRates.dto.ts

import { IExchangeRate, ExchangeRateSource, CurrencyCode } from './exchangeRates.interface.js'

function asRecord(data: unknown): Record<string, unknown> {
  return (data ?? {}) as Record<string, unknown>
}

export class CreateExchangeRateDTO {
  fromCurrency: CurrencyCode
  toCurrency: CurrencyCode
  rate: number
  rateDate: string
  source: ExchangeRateSource
  notes?: string

  constructor(data: unknown) {
    const d = asRecord(data)
    this.fromCurrency = d.fromCurrency as CurrencyCode
    this.toCurrency = d.toCurrency as CurrencyCode
    this.rate = Number(d.rate)
    this.rateDate = String(d.rateDate)
    this.source = (d.source as ExchangeRateSource) ?? 'MANUAL'
    if (d.notes != null && String(d.notes).trim() !== '') {
      this.notes = String(d.notes).trim()
    }
  }
}

export class UpdateExchangeRateDTO {
  rate?: number
  notes?: string | null
  isActive?: boolean

  constructor(data: unknown) {
    const d = asRecord(data)
    if (d.rate !== undefined) this.rate = Number(d.rate)
    if (d.notes !== undefined) this.notes = d.notes != null ? String(d.notes).trim() : null
    if (d.isActive !== undefined) this.isActive = Boolean(d.isActive)
  }
}

export class ExchangeRateResponseDTO {
  id: string
  empresaId: string
  fromCurrency: CurrencyCode
  toCurrency: CurrencyCode
  rate: number
  rateDate: string
  source: ExchangeRateSource
  isActive: boolean
  fetchedAt: string | null
  createdBy: string | null
  notes: string | null
  createdAt: string
  updatedAt: string

  constructor(rate: IExchangeRate) {
    this.id = rate.id
    this.empresaId = rate.empresaId
    this.fromCurrency = rate.fromCurrency
    this.toCurrency = rate.toCurrency
    this.rate = Number(rate.rate)
    this.rateDate = rate.rateDate instanceof Date
      ? rate.rateDate.toISOString().split('T')[0]
      : String(rate.rateDate)
    this.source = rate.source
    this.isActive = rate.isActive
    this.fetchedAt = rate.fetchedAt ? rate.fetchedAt.toISOString() : null
    this.createdBy = rate.createdBy ?? null
    this.notes = rate.notes ?? null
    this.createdAt = rate.createdAt.toISOString()
    this.updatedAt = rate.updatedAt.toISOString()
  }
}
