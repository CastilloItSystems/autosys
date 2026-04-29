import type { Toast } from "primereact/toast";
import type { DealerDocument } from "../services/dealerDocumentService";

export type DealerDocumentFormValues = {
  referenceType: string;
  referenceId: string;
  documentType: string;
  name: string;
  fileUrl: string;
  status: string;
};

export interface DealerDocumentFormProps {
  document: DealerDocument | null;
  onSave: () => void | Promise<void>;
  formId?: string;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  toast: React.RefObject<Toast> | null;
}
