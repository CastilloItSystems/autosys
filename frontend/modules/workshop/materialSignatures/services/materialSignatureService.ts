// app/api/workshop/materialSignatureService.ts
import apiClient from '@/app/api/apiClient'
import type {
  MaterialSignature,
  CreateMaterialSignatureInput,
  SignatureStatus,
} from '../interfaces/materialSignature.interface'

const BASE = '/workshop/material-signatures'

const materialSignatureService = {
  async listByMaterial(materialId: string) {
    const res = await apiClient.get(`${BASE}/materials/${materialId}`)
    return (res.data?.data ?? []) as MaterialSignature[]
  },
  async status(materialId: string) {
    const res = await apiClient.get(`${BASE}/materials/${materialId}/status`)
    return res.data as SignatureStatus
  },
  async create(data: CreateMaterialSignatureInput) {
    const res = await apiClient.post(BASE, data)
    return res.data as MaterialSignature
  },
  async delete(id: string) {
    const res = await apiClient.delete(`${BASE}/${id}`)
    return res.data
  },
}

export default materialSignatureService
