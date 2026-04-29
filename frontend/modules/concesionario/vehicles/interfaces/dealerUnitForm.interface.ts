import type { Toast } from "primereact/toast";
import type { DealerUnit } from "../interfaces/dealerUnit.interface";
import type { SaveDealerUnitRequest } from "../services/dealerUnitService";

export type DealerUnitFormValues = {
  brandId: string;
  warehouseId: string;
  modelId: string;
  code: string;
  version: string;
  year?: number;
  vin: string;
  plate: string;
  condition: SaveDealerUnitRequest["condition"];
  status: SaveDealerUnitRequest["status"];
  listPrice?: number;
  promoPrice?: number;
  location: string;
  isPublished: boolean;
  isActive: boolean;
};

export interface DealerUnitFormProps {
  unit: DealerUnit | null;
  brandOptions: Array<{ label: string; value: string }>;
  modelOptions: Array<{ label: string; value: string }>;
  warehouseOptions: Array<{ label: string; value: string }>;
  onSave: () => void | Promise<void>;
  formId?: string;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  toast: React.RefObject<Toast> | null;
}
