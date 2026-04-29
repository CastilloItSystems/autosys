// modules/crm/customer/interfaces/customerCrmForm.interface.ts
import { CustomerCrm } from "./customer.crm.interface";
import { Toast } from "primereact/toast";
import React from "react";

export interface CustomerCrmFormProps {
  customer?: CustomerCrm | null;
  formId?: string;
  onSave: () => void | Promise<void>;
  onCreated?: (item: any) => void;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  toast: React.RefObject<Toast> | null;
}
