import type { Toast } from "primereact/toast";
import type { DealerQuote } from "../interfaces/dealerQuote.interface";

export type DealerAccessoryType = "FACTURABLE" | "BONIFICADO" | "PROMOCIONAL";

export type DealerQuoteAccessoryRow = {
  itemId?: string | null;
  name: string;
  type: DealerAccessoryType;
  quantity: number;
  unitPrice: number;
  installed: boolean;
  notes?: string;
};

export type DealerQuoteFormValues = {
  dealerUnitId: string;
  customerId: string;
  customerName: string;
  customerDocument: string;
  customerPhone: string;
  customerEmail: string;
  listPrice?: number;
  discountPct?: number;
  offeredPrice?: number;
  taxPct?: number;
  adminFees?: number;
  tradeInValue?: number;
  requiredDeposit?: number;
  currency: "USD" | "VES" | "EUR";
  exchangeRate?: number;
  exchangeRateSource: "BCV_AUTO" | "MANUAL";
  validUntil?: Date | null;
  paymentTerms: string;
  financingRequired: boolean;
  notes: string;
  status: string;
  isActive: boolean;
  accessories: DealerQuoteAccessoryRow[];
};

export interface DealerQuoteFormProps {
  quote: DealerQuote | null;
  unitOptions: Array<{ label: string; value: string }>;
  onSave: () => void | Promise<void>;
  formId?: string;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  toast: React.RefObject<Toast> | null;
}
