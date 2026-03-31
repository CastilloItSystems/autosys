// app/api/workshop/vehicleHistoryService.ts
import apiClient from '../apiClient'
import type { WorkshopResponse } from '@/libs/interfaces/workshop'
import type { VehicleHistoryData } from '@/libs/interfaces/workshop'

const vehicleHistoryService = {
  async getHistory(vehicleId: string): Promise<WorkshopResponse<VehicleHistoryData>> {
    const res = await apiClient.get(`/workshop/vehicles/${vehicleId}/history`)
    return res.data
  },
}

export default vehicleHistoryService
