// modules/crm/campaigns/interfaces/campaignForm.interface.ts

export type CampaignFormValues = {
  name: string;
  description?: string;
  status: string;
  channel: string;
  budget?: number;
};

export interface CampaignFormProps {
  formId?: string;
  onSave: () => void | Promise<void>;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  toast: React.RefObject<import("primereact/toast").Toast> | null;
}
