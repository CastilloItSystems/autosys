import apiClient from "../apiClient";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface DealerExecutiveReport {
  totals: Record<string, number>;
  conversion: Record<string, number>;
  risks: Record<string, number>;
}

export interface DealerPipelineReport {
  reservations: Array<{ status: string; count: number }>;
  quotes: Array<{ status: string; count: number }>;
  testDrives: Array<{ status: string; count: number }>;
  financing: Array<{ status: string; count: number }>;
  deliveries: Array<{ status: string; count: number }>;
}

const dealerReportService = {
  async getExecutive(): Promise<ApiResponse<DealerExecutiveReport>> {
    const res = await apiClient.get("/dealer/reports/executive");
    return res.data;
  },
  async getPipeline(): Promise<ApiResponse<DealerPipelineReport>> {
    const res = await apiClient.get("/dealer/reports/pipeline");
    return res.data;
  },
};

export default dealerReportService;
