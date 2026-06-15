// app/api/workshop/deliveryReturnedPartService.ts
import apiClient from '@/app/api/apiClient'
import type {
  DeliveryReturnedPart,
  CreateReturnedPartInput,
} from '../interfaces/deliveryReturnedPart.interface'

const BASE = '/workshop/delivery-returned-parts'

const deliveryReturnedPartService = {
  async listByDelivery(deliveryId: string) {
    const res = await apiClient.get(`${BASE}/by-delivery/${deliveryId}`)
    return (res.data?.data ?? []) as DeliveryReturnedPart[]
  },
  async create(data: CreateReturnedPartInput) {
    const res = await apiClient.post(BASE, data)
    return res.data as DeliveryReturnedPart
  },
  async update(id: string, data: Partial<CreateReturnedPartInput>) {
    const res = await apiClient.put(`${BASE}/${id}`, data)
    return res.data as DeliveryReturnedPart
  },
  async delete(id: string) {
    const res = await apiClient.delete(`${BASE}/${id}`)
    return res.data
  },
  async markDeliveryPartsReturned(deliveryId: string) {
    const res = await apiClient.patch(`/workshop/deliveries/${deliveryId}/parts-returned`)
    return res.data
  },
}

export default deliveryReturnedPartService
