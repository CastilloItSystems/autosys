import type { DealerUnit } from "./dealerUnit.interface";

export type DealerQuoteStatus =
  | "DRAFT"
  | "SENT"
  | "NEGOTIATING"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED"
  | "CONVERTED";

export interface DealerQuote {
  id: string;
  empresaId: string;
  dealerUnitId: string;
  quoteNumber: string;
  status: DealerQuoteStatus;
  customerName: string;
  customerDocument?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  listPrice?: string | number | null;
  discountPct?: string | number | null;
  discountAmount?: string | number | null;
  offeredPrice?: string | number | null;
  taxPct?: string | number | null;
  taxAmount?: string | number | null;
  totalAmount?: string | number | null;
  currency?: string | null;
  validUntil?: string | null;
  paymentTerms?: string | null;
  financingRequired: boolean;
  notes?: string | null;
  isActive: boolean;
  sentAt?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  convertedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  dealerUnit: Pick<DealerUnit, "id" | "code" | "vin" | "plate" | "status" | "brand" | "model">;
}
