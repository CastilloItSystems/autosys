import type { Toast } from "primereact/toast";
import type { DealerFinancing } from "../interfaces/dealerFinancing.interface";

export type DealerFinancingFormValues = {
  dealerUnitId: string;
  customerId: string;
  customerName: string;
  bankName: string;
  currency: "USD" | "VES" | "EUR";
  exchangeRate?: number;
  exchangeRateSource: "BCV_AUTO" | "MANUAL";
  requestedAmount?: number;
  approvedAmount?: number;
  termMonths?: number;
  status: string;
};

export interface DealerFinancingFormProps {
  financing: DealerFinancing | null;
  unitOptions: Array<{ label: string; value: string }>;
  onSave: () => void | Promise<void>;
  formId?: string;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  toast: React.RefObject<Toast> | null;
}
