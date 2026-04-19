// libs/interfaces/finance/exchangeRate.interface.ts

export type ExchangeRateSource = 'BCV' | 'MANUAL' | 'PARALLEL'
export type CurrencyCode = 'USD' | 'VES' | 'EUR'

export interface ExchangeRate {
  id: string
  fromCurrency: CurrencyCode
  toCurrency: CurrencyCode
  rate: number
  rateDate: string
  source: ExchangeRateSource
  isActive: boolean
  notes: string | null
  empresaId: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface ExchangeRateFilters {
  fromCurrency?: CurrencyCode
  toCurrency?: CurrencyCode
  source?: ExchangeRateSource
  isActive?: boolean
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export interface CreateExchangeRateInput {
  fromCurrency: CurrencyCode
  toCurrency: CurrencyCode
  rate: number
  rateDate: string
  source?: ExchangeRateSource
  notes?: string
}

export interface UpdateExchangeRateInput {
  rate?: number
  rateDate?: string
  notes?: string
  isActive?: boolean
}

export interface ExchangeRateResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface ExchangeRatePagedResponse<T> {
  success: boolean
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}
