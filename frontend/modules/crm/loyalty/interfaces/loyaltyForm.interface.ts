// modules/crm/loyalty/interfaces/loyaltyForm.interface.ts

export type LoyaltyFormValues = {
  type: "EVENT" | "SURVEY";
  customerId: string;
  eventType: string;
  title?: string;
  description?: string;
  suggestedAction?: string;
  score?: number;
  feedback?: string;
};

export interface LoyaltyFormProps {
  formId?: string;
  onSave: () => void | Promise<void>;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  toast: React.RefObject<import("primereact/toast").Toast> | null;
}
