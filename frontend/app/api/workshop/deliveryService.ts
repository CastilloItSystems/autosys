// app/api/workshop/deliveryService.ts
import apiClient from '../apiClient'
import type {
  VehicleDelivery,
  DeliveryFilters,
  CreateDeliveryInput,
  WorkshopResponse,
} from '@/libs/interfaces/workshop'

const BASE = '/workshop/deliveries'

const deliveryService = {
  async getAll(filters?: DeliveryFilters): Promise<WorkshopResponse<VehicleDelivery[]>> {
    const res = await apiClient.get(BASE, { params: filters })
    return res.data
  },

  async getById(id: string): Promise<WorkshopResponse<VehicleDelivery>> {
    const res = await apiClient.get(`${BASE}/${id}`)
    return res.data
  },

  async create(data: CreateDeliveryInput): Promise<WorkshopResponse<VehicleDelivery>> {
    const res = await apiClient.post(BASE, data)
    return res.data
  },

  async getByOrder(orderId: string): Promise<WorkshopResponse<VehicleDelivery>> {
    const res = await apiClient.get(`${BASE}/order/${orderId}`)
    return res.data
  },
}

export default deliveryService
