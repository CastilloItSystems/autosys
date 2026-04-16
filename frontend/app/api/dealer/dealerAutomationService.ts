import apiClient from "../apiClient";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface DealerAutomationAlert {
  key: string;
  severity: "info" | "warning" | "danger";
  message: string;
  count: number;
}

export interface DealerAutomationSummary {
  generatedAt: string;
  totalAlerts: number;
  alerts: DealerAutomationAlert[];
}

const dealerAutomationService = {
  async getAlerts(): Promise<ApiResponse<DealerAutomationAlert[]>> {
    const res = await apiClient.get("/dealer/automations/alerts");
    return res.data;
  },
  async runChecks(): Promise<ApiResponse<DealerAutomationSummary>> {
    const res = await apiClient.post("/dealer/automations/run-checks");
    return res.data;
  },
};

export default dealerAutomationService;
