import apiClient from "../apiClient";
import type { CreateExpenseData, CreateRecurringRuleData } from "@/libs/interfaces/finance";

const expenseService = {
  async getAll(params?: {
    status?: string;
    category?: string;
    supplierId?: string;
    isRecurring?: string;
    from?: string;
    to?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get("/finance/expenses", { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get(`/finance/expenses/${id}`);
    return response.data;
  },

  async create(data: CreateExpenseData) {
    const response = await apiClient.post("/finance/expenses", data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateExpenseData>) {
    const response = await apiClient.patch(`/finance/expenses/${id}`, data);
    return response.data;
  },

  async cancel(id: string) {
    const response = await apiClient.post(`/finance/expenses/${id}/cancel`);
    return response.data;
  },

  // Reglas recurrentes
  async getAllRules(params?: { page?: number; limit?: number }) {
    const response = await apiClient.get("/finance/expenses/recurring-rules", { params });
    return response.data;
  },

  async createRule(data: CreateRecurringRuleData) {
    const response = await apiClient.post("/finance/expenses/recurring-rules", data);
    return response.data;
  },

  async updateRule(id: string, data: Partial<CreateRecurringRuleData> & { isActive?: boolean }) {
    const response = await apiClient.patch(`/finance/expenses/recurring-rules/${id}`, data);
    return response.data;
  },

  async runRecurring() {
    const response = await apiClient.post("/finance/expenses/recurring-rules/run");
    return response.data;
  },
};

export default expenseService;
