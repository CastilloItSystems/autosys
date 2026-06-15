// app/api/workshop/postRepairScanService.ts
import apiClient from '@/app/api/apiClient'
import type {
  PostRepairScan,
  PostRepairScanFilters,
  CreatePostRepairScanInput,
} from '../interfaces/postRepairScan.interface'

const BASE = '/workshop/post-repair-scans'

const postRepairScanService = {
  async getAll(filters?: PostRepairScanFilters) {
    const res = await apiClient.get(BASE, { params: filters })
    return res.data as { data: PostRepairScan[]; page: number; limit: number; total: number }
  },
  async getById(id: string) {
    const res = await apiClient.get(`${BASE}/${id}`)
    return res.data as PostRepairScan
  },
  async create(data: CreatePostRepairScanInput) {
    const res = await apiClient.post(BASE, data)
    return res.data as PostRepairScan
  },
  async update(id: string, data: Partial<CreatePostRepairScanInput>) {
    const res = await apiClient.put(`${BASE}/${id}`, data)
    return res.data as PostRepairScan
  },
  async delete(id: string) {
    const res = await apiClient.delete(`${BASE}/${id}`)
    return res.data
  },
}

export default postRepairScanService
