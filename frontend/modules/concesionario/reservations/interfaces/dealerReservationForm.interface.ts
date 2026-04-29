import type { Toast } from "primereact/toast";
import type { DealerReservation } from "../interfaces/dealerReservation.interface";

export type DealerReservationFormValues = {
  dealerUnitId: string;
  customerId: string;
  customerName: string;
  customerDocument: string;
  customerPhone: string;
  customerEmail: string;
  offeredPrice?: number;
  depositAmount?: number;
  currency: "USD" | "VES" | "EUR";
  exchangeRate?: number;
  exchangeRateSource: "BCV_AUTO" | "MANUAL";
  expiresAt?: Date | null;
  notes: string;
  sourceChannel: string;
  status: string;
  isActive: boolean;
};

export interface DealerReservationFormProps {
  reservation: DealerReservation | null;
  unitOptions: Array<{ label: string; value: string }>;
  onSave: () => void | Promise<void>;
  formId?: string;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  toast: React.RefObject<Toast> | null;
}
