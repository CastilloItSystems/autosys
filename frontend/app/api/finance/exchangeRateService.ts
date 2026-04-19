// app/api/finance/exchangeRateService.ts
import apiClient from '../apiClient'
import type {
  ExchangeRate,
  ExchangeRateFilters,
  CreateExchangeRateInput,
  UpdateExchangeRateInput,
  ExchangeRateResponse,
  ExchangeRatePagedResponse,
} from '@/libs/interfaces/finance'

const BASE = '/exchange-rates'

const exchangeRateService = {
  async getAll(
    filters?: ExchangeRateFilters
  ): Promise<ExchangeRatePagedResponse<ExchangeRate>> {
    const res = await apiClient.get(BASE, { params: filters })
    return res.data
  },

  async getLatest(
    fromCurrency: string,
    toCurrency: string
  ): Promise<ExchangeRateResponse<ExchangeRate | null>> {
    const res = await apiClient.get(`${BASE}/latest`, {
      params: { fromCurrency, toCurrency },
    })
    return res.data
  },

  async getActive(): Promise<ExchangeRateResponse<ExchangeRate[]>> {
    const res = await apiClient.get(`${BASE}/active`)
    return res.data
  },

  async getById(id: string): Promise<ExchangeRateResponse<ExchangeRate>> {
    const res = await apiClient.get(`${BASE}/${id}`)
    return res.data
  },

  async create(
    data: CreateExchangeRateInput
  ): Promise<ExchangeRateResponse<ExchangeRate>> {
    const res = await apiClient.post(BASE, data)
    return res.data
  },

  async update(
    id: string,
    data: UpdateExchangeRateInput
  ): Promise<ExchangeRateResponse<ExchangeRate>> {
    const res = await apiClient.put(`${BASE}/${id}`, data)
    return res.data
  },

  async delete(id: string): Promise<ExchangeRateResponse<null>> {
    const res = await apiClient.delete(`${BASE}/${id}`)
    return res.data
  },

  async fetchBcv(): Promise<ExchangeRateResponse<ExchangeRate[]>> {
    const res = await apiClient.post(`${BASE}/fetch-bcv`)
    return res.data
  },
}

export default exchangeRateService
