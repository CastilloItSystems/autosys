// app/api/workshop/diagnosisService.ts
import apiClient from '../apiClient'
import type {
  Diagnosis,
  DiagnosisFilters,
  CreateDiagnosisInput,
  UpdateDiagnosisInput,
  DiagnosisFinding,
  DiagnosisSuggestedOp,
  DiagnosisSuggestedPart,
  CreateFindingInput,
  CreateSuggestedOpInput,
  CreateSuggestedPartInput,
  WorkshopPagedResponse,
  WorkshopResponse,
} from '@/libs/interfaces/workshop'

const BASE = '/workshop/diagnoses'

const diagnosisService = {
  async getAll(filters?: DiagnosisFilters): Promise<WorkshopPagedResponse<Diagnosis>> {
    const params = filters?.status === 'ALL' ? { ...filters, status: undefined } : filters
    const res = await apiClient.get(BASE, { params })
    return res.data
  },

  async getById(id: string): Promise<WorkshopResponse<Diagnosis>> {
    const res = await apiClient.get(`${BASE}/${id}`)
    return res.data
  },

  async create(data: CreateDiagnosisInput): Promise<WorkshopResponse<Diagnosis>> {
    const res = await apiClient.post(BASE, data)
    return res.data
  },

  async update(id: string, data: UpdateDiagnosisInput): Promise<WorkshopResponse<Diagnosis>> {
    const res = await apiClient.put(`${BASE}/${id}`, data)
    return res.data
  },

  async delete(id: string): Promise<WorkshopResponse<null>> {
    const res = await apiClient.delete(`${BASE}/${id}`)
    return res.data
  },

  async addFinding(id: string, data: CreateFindingInput): Promise<WorkshopResponse<DiagnosisFinding>> {
    const res = await apiClient.post(`${BASE}/${id}/findings`, data)
    return res.data
  },

  async removeFinding(diagnosisId: string, findingId: string): Promise<WorkshopResponse<null>> {
    const res = await apiClient.delete(`${BASE}/${diagnosisId}/findings/${findingId}`)
    return res.data
  },

  async addSuggestedOp(id: string, data: CreateSuggestedOpInput): Promise<WorkshopResponse<DiagnosisSuggestedOp>> {
    const res = await apiClient.post(`${BASE}/${id}/suggested-ops`, data)
    return res.data
  },

  async addSuggestedPart(id: string, data: CreateSuggestedPartInput): Promise<WorkshopResponse<DiagnosisSuggestedPart>> {
    const res = await apiClient.post(`${BASE}/${id}/suggested-parts`, data)
    return res.data
  },
}

export default diagnosisService
