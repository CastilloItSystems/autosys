import type { DealerUnit } from "@/modules/concesionario/vehicles/interfaces/dealerUnit.interface";

export interface DealerQuoteAccessory {
  id: string;
  itemId?: string | null;
  name: string;
  type: "FACTURABLE" | "BONIFICADO" | "PROMOCIONAL";
  quantity: number;
  unitPrice: string | number;
  totalPrice: string | number;
  installed: boolean;
  notes?: string | null;
}

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
  customerId: string;
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
  accessoriesTotal?: string | number | null;
  adminFees?: string | number | null;
  tradeInValue?: string | number | null;
  requiredDeposit?: string | number | null;
  grandTotal?: string | number | null;
  currentVersion?: number;
  accessories?: DealerQuoteAccessory[];
  currency: "USD" | "VES" | "EUR";
  exchangeRate?: string | number | null;
  exchangeRateSource?: "BCV_AUTO" | "MANUAL" | null;
  fiscalStatus:
    | "NOT_REQUESTED"
    | "ORDER_DRAFT"
    | "ORDER_APPROVED"
    | "PREINVOICE_READY"
    | "PAID"
    | "INVOICED"
    | "ERROR";
  fiscalError?: string | null;
  salesOrderId?: string | null;
  preInvoiceId?: string | null;
  invoiceId?: string | null;
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
  customer: {
    id: string;
    code: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    taxId?: string | null;
  };
  dealerUnit: Pick<DealerUnit, "id" | "code" | "vin" | "plate" | "status" | "brand" | "model">;
}
