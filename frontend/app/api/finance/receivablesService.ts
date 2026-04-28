import apiClient from "../apiClient";

export interface ReceivableItem {
  id: string;
  preInvoiceNumber: string;
  customer: { id: string; name: string; code: string; taxId: string | null } | null;
  total: number;
  paidAmount: number;
  pendingAmount: number;
  currency: string;
  dueDate: string | null;
  daysOverdue: number | null;
  isOverdue: boolean;
  agingBucket: "0-30" | "31-60" | "61-90" | "+90" | "sin-vencimiento";
  createdAt: string;
}

export interface ReceivablesData {
  total: number;
  count: number;
  overdueCount: number;
  aging: {
    "0-30": number;
    "31-60": number;
    "61-90": number;
    "+90": number;
    "sin-vencimiento": number;
  };
  items: ReceivableItem[];
}

const receivablesService = {
  async getReceivables(): Promise<ReceivablesData> {
    const res = await apiClient.get("/finance/dashboard/receivables");
    return res.data.data;
  },
};

export default receivablesService;
