import apiClient from "@/app/api/apiClient";

export interface MonthlyCashFlowPoint {
  month: string;
  USD_income: number;
  USD_outcome: number;
  VES_income: number;
  VES_outcome: number;
}

export interface TopDebtor {
  customerId: string;
  customerName: string;
  pendingAmount: number;
  count: number;
}

export interface FinanceDashboardData {
  bankAccounts: {
    id: string;
    name: string;
    type: string;
    currency: string;
    currentBalance: number;
  }[];
  balancesByCurrency: Record<string, number>;
  topDebtors: TopDebtor[];
  monthlyCashFlow: MonthlyCashFlowPoint[];
  ap: {
    totalPending: number;
    totalPartial: number;
    countPending: number;
    countPartial: number;
    overdueCount: number;
    dueSoonCount: number;
  };
  expenses: {
    total: number;
    paid: number;
    count: number;
    byCategory: { category: string; total: number; count: number }[];
  };
  paymentsThisMonth: { total: number; count: number };
  recentPayments: {
    id: string;
    paymentNumber: string;
    amount: number;
    currency: string;
    method: string;
    processedAt: string;
    supplierName: string | null;
    reference: string | null;
    isExpense: boolean;
  }[];
  recentBills: {
    id: string;
    internalNumber: string;
    billNumber: string | null;
    supplierName: string;
    total: number;
    pendingAmount: number;
    currency: string;
    status: string;
    dueDate: string | null;
  }[];
  ar: {
    totalPending: number;
    countPending: number;
    overdueCount: number;
    collectedThisMonth: number;
    countCollectedThisMonth: number;
    recentPending: {
      id: string;
      preInvoiceNumber: string;
      customerName: string | null;
      total: number;
      pendingAmount: number;
      currency: string;
      dueDate: string | null;
      isOverdue: boolean;
      createdAt: string;
    }[];
  };
}

const financeDashboardService = {
  async getDashboard(): Promise<FinanceDashboardData> {
    const res = await apiClient.get("/finance/dashboard");
    return res.data.data;
  },
};

export default financeDashboardService;
