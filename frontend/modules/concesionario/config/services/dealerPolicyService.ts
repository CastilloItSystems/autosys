import apiClient from "@/app/api/apiClient";
import type { DealerPolicy } from "../interfaces/dealerPolicy.interface";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

export interface SaveDealerPolicyRequest {
  quoteValidityDays?: number;
  reservationValidityDays?: number;
  minDepositAmount?: number | null;
  minDepositPct?: number | null;
  maxDiscountPctAdvisor?: number;
  maxDiscountPctSupervisor?: number;
  maxDiscountPctManager?: number;
  requireTestDrive?: boolean;
  requireAppraisalForTradeIn?: boolean;
  requireDepositForReservation?: boolean;
  leadFollowUpSlaHours?: number;
  commissionPctDefault?: number;
  alertWindowHours?: number;
  notes?: string | null;
  isActive?: boolean;
}

const BASE_ROUTE = "/dealer/config";

const dealerPolicyService = {
  async get(): Promise<ApiResponse<DealerPolicy>> {
    const res = await apiClient.get(BASE_ROUTE);
    return res.data;
  },

  async upsert(data: SaveDealerPolicyRequest): Promise<ApiResponse<DealerPolicy>> {
    const res = await apiClient.put(BASE_ROUTE, data);
    return res.data;
  },
};

export default dealerPolicyService;
