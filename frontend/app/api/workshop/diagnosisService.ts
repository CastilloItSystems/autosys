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
  DiagnosisEvidence,
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
    const res = await apiClient.post(`${BASE}/${id}/operations`, data)
    return res.data
  },

  async addSuggestedPart(id: string, data: CreateSuggestedPartInput): Promise<WorkshopResponse<DiagnosisSuggestedPart>> {
    const res = await apiClient.post(`${BASE}/${id}/parts`, data)
    return res.data
  },

  async removeSuggestedOp(diagnosisId: string, opId: string): Promise<WorkshopResponse<null>> {
    const res = await apiClient.delete(`${BASE}/${diagnosisId}/operations/${opId}`)
    return res.data
  },

  async removeSuggestedPart(diagnosisId: string, partId: string): Promise<WorkshopResponse<null>> {
    const res = await apiClient.delete(`${BASE}/${diagnosisId}/parts/${partId}`)
    return res.data
  },

  async addEvidence(id: string, data: { type: string; url: string; description?: string }): Promise<WorkshopResponse<DiagnosisEvidence>> {
    const res = await apiClient.post(`${BASE}/${id}/evidences`, data)
    return res.data
  },

  async uploadEvidenceFile(id: string, file: File, type: string, description?: string): Promise<WorkshopResponse<DiagnosisEvidence>> {
    const form = new FormData()
    form.append('file', file)
    form.append('type', type)
    if (description) form.append('description', description)
    const res = await apiClient.post(`${BASE}/${id}/evidences/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  async removeEvidence(diagnosisId: string, evidenceId: string): Promise<WorkshopResponse<null>> {
    const res = await apiClient.delete(`${BASE}/${diagnosisId}/evidences/${evidenceId}`)
    return res.data
  },

  async updateStatus(id: string, status: string): Promise<WorkshopResponse<Diagnosis>> {
    const res = await apiClient.put(`${BASE}/${id}`, { status })
    return res.data
  },
}

export default diagnosisService
