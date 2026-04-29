import apiClient from "@/app/api/apiClient";
import type {
  BankAccount,
  BankAccountBalance,
  CreateBankAccountData,
  UpdateBankAccountData,
} from "../interfaces/bankAccount";

const bankAccountService = {
  async getAll(params?: {
    isActive?: string;
    currency?: string;
    type?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get("/finance/bank-accounts", { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get(`/finance/bank-accounts/${id}`);
    return response.data;
  },

  async getBalance(id: string): Promise<{ data: BankAccountBalance }> {
    const response = await apiClient.get(
      `/finance/bank-accounts/${id}/balance`,
    );
    return response.data;
  },

  async create(data: CreateBankAccountData) {
    const response = await apiClient.post("/finance/bank-accounts", data);
    return response.data;
  },

  async update(id: string, data: UpdateBankAccountData) {
    const response = await apiClient.patch(
      `/finance/bank-accounts/${id}`,
      data,
    );
    return response.data;
  },

  async syncBalances() {
    const response = await apiClient.post(
      "/finance/bank-accounts/sync-balances",
    );
    return response.data;
  },
};

export default bankAccountService;
