import type { Toast } from "primereact/toast";
import type { DealerDelivery } from "../interfaces/dealerDelivery.interface";

export type DealerDeliveryFormValues = {
  dealerUnitId: string;
  customerId: string;
  customerName: string;
  scheduledAt: Date | null;
  status: string;
};

export interface DealerDeliveryFormProps {
  delivery: DealerDelivery | null;
  unitOptions: Array<{ label: string; value: string }>;
  onSave: () => void | Promise<void>;
  formId?: string;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  toast: React.RefObject<Toast> | null;
}
