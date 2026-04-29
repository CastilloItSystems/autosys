import type { Toast } from "primereact/toast";
import type { DealerAfterSale } from "../services/dealerAfterSaleService";

export type DealerAfterSaleFormValues = {
  type: string;
  status: string;
  customerId: string;
  customerName: string;
  title: string;
  description?: string;
  dueAt?: Date | null;
  satisfactionScore?: number;
};

export interface DealerAfterSaleFormProps {
  afterSale: DealerAfterSale | null;
  onSave: () => void | Promise<void>;
  formId?: string;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  toast: React.RefObject<Toast> | null;
}
