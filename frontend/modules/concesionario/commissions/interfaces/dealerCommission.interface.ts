export type DealerCommissionStatus = "PENDING" | "APPROVED" | "PAID" | "CANCELLED";

export interface DealerCommission {
  id: string;
  dealerQuoteId?: string | null;
  salesOrderId?: string | null;
  sellerId?: string | null;
  sellerName?: string | null;
  baseAmount: string | number;
  commissionPct: string | number;
  commissionAmount: string | number;
  currency: "USD" | "VES" | "EUR";
  status: DealerCommissionStatus;
  paidAt?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  dealerQuote?: {
    id: string;
    quoteNumber: string;
    customerName: string;
  } | null;
}
