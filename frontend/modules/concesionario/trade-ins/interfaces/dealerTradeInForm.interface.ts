import type { Toast } from "primereact/toast";
import type { DealerTradeIn } from "../interfaces/dealerTradeIn.interface";

export type DealerTradeInFormValues = {
  customerId: string;
  customerName: string;
  vehicleBrand: string;
  vehicleModel: string;
  requestedValue?: number;
  appraisedValue?: number;
  approvedValue?: number;
  status: string;
};

export interface DealerTradeInFormProps {
  tradeIn: DealerTradeIn | null;
  onSave: () => void | Promise<void>;
  formId?: string;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  toast: React.RefObject<Toast> | null;
}
