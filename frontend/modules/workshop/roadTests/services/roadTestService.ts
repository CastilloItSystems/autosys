// app/api/workshop/roadTestService.ts
import apiClient from '@/app/api/apiClient'
import type {
  RoadTest,
  RoadTestFilters,
  CreateRoadTestInput,
  AuthorizeInput,
  ClientAuthorizeInput,
  DepartInput,
  ReturnInput,
} from '../interfaces/roadTest.interface'

const BASE = '/workshop/road-tests'

const roadTestService = {
  async getAll(filters?: RoadTestFilters) {
    const res = await apiClient.get(BASE, { params: filters })
    return res.data as { data: RoadTest[]; page: number; limit: number; total: number }
  },
  async getById(id: string) {
    const res = await apiClient.get(`${BASE}/${id}`)
    return res.data as RoadTest
  },
  async create(data: CreateRoadTestInput) {
    const res = await apiClient.post(BASE, data)
    return res.data as RoadTest
  },
  async update(id: string, data: Partial<CreateRoadTestInput>) {
    const res = await apiClient.put(`${BASE}/${id}`, data)
    return res.data as RoadTest
  },
  async authorize(id: string, input: AuthorizeInput) {
    const res = await apiClient.patch(`${BASE}/${id}/authorize`, input)
    return res.data as RoadTest
  },
  async authorizeClient(id: string, input: ClientAuthorizeInput) {
    const res = await apiClient.patch(`${BASE}/${id}/client-authorize`, input)
    return res.data as RoadTest
  },
  async depart(id: string, input: DepartInput) {
    const res = await apiClient.patch(`${BASE}/${id}/depart`, input)
    return res.data as RoadTest
  },
  async returnVehicle(id: string, input: ReturnInput) {
    const res = await apiClient.patch(`${BASE}/${id}/return`, input)
    return res.data as RoadTest
  },
  async cancel(id: string) {
    const res = await apiClient.patch(`${BASE}/${id}/cancel`)
    return res.data as RoadTest
  },
}

export default roadTestService
