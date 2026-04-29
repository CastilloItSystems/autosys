import type { Toast } from "primereact/toast";
import type { DealerTestDrive } from "../interfaces/dealerTestDrive.interface";

export type DealerTestDriveFormValues = {
  dealerUnitId: string;
  customerId: string;
  customerName: string;
  customerDocument: string;
  customerPhone: string;
  customerEmail: string;
  driverLicense: string;
  scheduledAt: Date | null;
  advisorName: string;
  routeDescription: string;
  observations: string;
  customerFeedback: string;
  status: string;
  isActive: boolean;
};

export interface DealerTestDriveFormProps {
  testDrive: DealerTestDrive | null;
  unitOptions: Array<{ label: string; value: string }>;
  onSave: () => void | Promise<void>;
  formId?: string;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  toast: React.RefObject<Toast> | null;
}
