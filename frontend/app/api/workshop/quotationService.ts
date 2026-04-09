// app/api/workshop/quotationService.ts
import apiClient from '../apiClient'
import type {
  WorkshopQuotation,
  QuotationFilters,
  CreateQuotationInput,
  UpdateQuotationInput,
  RegisterApprovalInput,
  ConvertToSOInput,
  QuotationStatus,
  QuotationPagedResponse,
  QuotationResponse,
} from '@/libs/interfaces/workshop'

const BASE = '/workshop/quotations'

const quotationService = {
  async getAll(filters?: QuotationFilters): Promise<QuotationPagedResponse> {
    const res = await apiClient.get(BASE, { params: filters })
    return res.data
  },

  async getById(id: string): Promise<QuotationResponse> {
    const res = await apiClient.get(`${BASE}/${id}`)
    return res.data
  },

  async create(data: CreateQuotationInput): Promise<QuotationResponse> {
    const res = await apiClient.post(BASE, data)
    return res.data
  },

  async update(id: string, data: UpdateQuotationInput): Promise<QuotationResponse> {
    const res = await apiClient.put(`${BASE}/${id}`, data)
    return res.data
  },

  async updateStatus(id: string, status: QuotationStatus): Promise<QuotationResponse> {
    const res = await apiClient.patch(`${BASE}/${id}/status`, { status })
    return res.data
  },

  async registerApproval(id: string, data: RegisterApprovalInput): Promise<QuotationResponse> {
    const res = await apiClient.post(`${BASE}/${id}/approve`, data)
    return res.data
  },

  async convertToSO(id: string, data?: ConvertToSOInput): Promise<QuotationResponse> {
    const res = await apiClient.post(`${BASE}/${id}/convert`, data ?? {})
    return res.data
  },
}

export default quotationService
