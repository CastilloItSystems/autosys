import apiClient from "@/app/api/apiClient";

export type CurrencyBreakdown = Record<string, number>;

export interface MonthlyCashFlowPoint {
  month: string;
  USD_income: number;
  USD_outcome: number;
  VES_income: number;
  VES_outcome: number;
  incomeUSD_eq: number;
  outcomeUSD_eq: number;
}

export interface TopDebtor {
  customerId: string;
  customerName: string;
  /** Monto pendiente expresado en USD (equivalente). */
  pendingAmount: number;
  pendingByCurrency: CurrencyBreakdown;
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
  balancesByCurrency: CurrencyBreakdown;
  /** Saldo total de cuentas bancarias convertido a USD. */
  totalBalanceUSD: number;
  topDebtors: TopDebtor[];
  monthlyCashFlow: MonthlyCashFlowPoint[];
  /** Tasas usadas (unidades por 1 USD). */
  fxRates: CurrencyBreakdown;
  ap: {
    /** Todos los montos `*` son equivalente USD. Breakdown en `*ByCurrency`. */
    totalPending: number;
    totalPartial: number;
    totalPaid: number;
    pendingByCurrency: CurrencyBreakdown;
    partialByCurrency: CurrencyBreakdown;
    paidByCurrency: CurrencyBreakdown;
    countPending: number;
    countPartial: number;
    overdueCount: number;
    dueSoonCount: number;
  };
  expenses: {
    total: number; // USD eq
    paid: number; // USD eq
    count: number;
    totalByCurrency: CurrencyBreakdown;
    paidByCurrency: CurrencyBreakdown;
    byCategory: {
      category: string;
      total: number; // USD eq
      byCurrency: CurrencyBreakdown;
      count: number;
    }[];
  };
  paymentsThisMonth: {
    total: number; // USD eq
    count: number;
    byCurrency: CurrencyBreakdown;
  };
  recentPayments: {
    id: string;
    paymentNumber: string;
    amount: number;
    amountUSD: number | null;
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
    totalUSD: number | null;
    pendingAmount: number;
    pendingAmountUSD: number | null;
    currency: string;
    status: string;
    dueDate: string | null;
  }[];
  ar: {
    totalPending: number; // USD eq
    pendingByCurrency: CurrencyBreakdown;
    countPending: number;
    overdueCount: number;
    collectedThisMonth: number; // USD eq
    collectedByCurrency: CurrencyBreakdown;
    countCollectedThisMonth: number;
    recentPending: {
      id: string;
      preInvoiceNumber: string;
      customerName: string | null;
      total: number;
      pendingAmount: number;
      pendingAmountUSD: number;
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
