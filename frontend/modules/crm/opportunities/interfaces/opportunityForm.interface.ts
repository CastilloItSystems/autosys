// modules/crm/opportunities/interfaces/opportunityForm.interface.ts

export type OpportunityFormValues = {
  title: string;
  channel: "REPUESTOS" | "TALLER" | "VEHICULOS";
  amount?: number;
  description?: string;
  nextActivityAt: Date | null;
  expectedCloseAt: Date | null;
  ownerId?: string;
};

export interface OpportunityFormProps {
  formId?: string;
  onSave: () => void | Promise<void>;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  toast: React.RefObject<import("primereact/toast").Toast> | null;
}
