// backend/src/features/exchangeRates/exchangeRates.interface.ts

export type ExchangeRateSource = 'BCV' | 'PARALLEL' | 'MANUAL'
export type CurrencyCode = 'USD' | 'VES' | 'EUR'

export interface IExchangeRate {
  id: string
  empresaId: string
  fromCurrency: CurrencyCode
  toCurrency: CurrencyCode
  rate: number
  rateDate: Date
  source: ExchangeRateSource
  isActive: boolean
  fetchedAt: Date | null
  createdBy: string | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ICreateExchangeRateInput {
  fromCurrency: CurrencyCode
  toCurrency: CurrencyCode
  rate: number
  rateDate: string // ISO date string
  source?: ExchangeRateSource
  notes?: string
}

export interface IUpdateExchangeRateInput {
  rate?: number
  notes?: string
  isActive?: boolean
}

export interface IExchangeRateFilters {
  fromCurrency?: CurrencyCode
  toCurrency?: CurrencyCode
  source?: ExchangeRateSource
  dateFrom?: string
  dateTo?: string
  isActive?: boolean
  page?: number
  limit?: number
}

export interface IBcvRateData {
  usdVes: number
  eurVes: number
  date: Date
}
