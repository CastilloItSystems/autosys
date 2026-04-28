import apiClient from "../apiClient";

const cashFlowService = {
  async getAll(params?: {
    bankAccountId?: string;
    from?: string;
    to?: string;
    source?: string;
    type?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get("/finance/cash-flow", { params });
    return response.data;
  },

  async getSummary(params?: { bankAccountId?: string; from?: string; to?: string; convertTo?: string }) {
    const response = await apiClient.get("/finance/cash-flow/summary", { params });
    return response.data;
  },

  async createTransfer(data: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    currency?: string;
    exchangeRate?: number;
    description?: string;
  }) {
    const response = await apiClient.post("/finance/cash-flow/transfer", data);
    return response.data;
  },

  async createAdjustment(data: {
    bankAccountId: string;
    amount: number;
    description: string;
    exchangeRate?: number;
  }) {
    const response = await apiClient.post("/finance/cash-flow/adjustment", data);
    return response.data;
  },
};

export default cashFlowService;
