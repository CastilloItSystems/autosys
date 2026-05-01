import apiClient from "@/app/api/apiClient";
import type { WorkshopResponse } from "@/modules/workshop/shared/interfaces/shared.interface";
import type { VehicleHistoryData } from "../interfaces/vehicleHistory.interface";

const vehicleHistoryService = {
  async getHistory(
    vehicleId: string,
  ): Promise<WorkshopResponse<VehicleHistoryData>> {
    const res = await apiClient.get(`/workshop/vehicles/${vehicleId}/history`);
    return res.data;
  },
};

export default vehicleHistoryService;
