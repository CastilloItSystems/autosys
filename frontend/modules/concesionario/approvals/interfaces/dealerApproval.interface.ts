import type { Toast } from "primereact/toast";
import type { DealerApproval } from "../services/dealerApprovalService";

export type DealerApprovalFormValues = {
  type: string;
  status: string;
  title: string;
  reason?: string;
  requestedAmount?: number;
  requestedPct?: number;
  resolutionNotes?: string;
};

export interface DealerApprovalFormProps {
  approval: DealerApproval | null;
  onSave: () => void | Promise<void>;
  formId?: string;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  toast: React.RefObject<Toast> | null;
}
