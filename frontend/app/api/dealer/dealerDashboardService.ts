import apiClient from "../apiClient";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface DealerOverview {
  units: { total: number; available: number; reserved: number };
  reservations: { total: number };
  quotes: { total: number; approved: number };
  testDrives: { total: number; completed: number };
  tradeIns: { total: number };
  financing: { total: number; approved: number };
  deliveries: { total: number; delivered: number };
}

export interface DealerHistoryItem {
  id: string;
  type: "RESERVATION" | "QUOTE" | "TEST_DRIVE" | "TRADE_IN" | "FINANCING" | "DELIVERY";
  number: string;
  status: string;
  customerName: string;
  unitRef: string;
  occurredAt: string;
}

export interface DealerIntegrationStatus {
  crm: {
    leadsVehiculos: number;
  };
  alerts: Array<{
    key: string;
    label: string;
    count: number;
    severity: "success" | "info" | "warning" | "danger";
  }>;
}

const dealerDashboardService = {
  async getOverview(): Promise<ApiResponse<DealerOverview>> {
    const res = await apiClient.get("/dealer/dashboard/overview");
    return res.data;
  },
  async getHistory(params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<DealerHistoryItem>> {
    const res = await apiClient.get("/dealer/history", { params });
    return res.data;
  },
  async getIntegrations(): Promise<ApiResponse<DealerIntegrationStatus>> {
    const res = await apiClient.get("/dealer/integrations/status");
    return res.data;
  },
};

export default dealerDashboardService;
