import type { DealerUnit } from "./dealerUnit.interface";

export type DealerFinancingStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "DISBURSED";

export interface DealerFinancing {
  id: string;
  financingNumber: string;
  status: DealerFinancingStatus;
  customerName: string;
  requestedAmount?: string | number | null;
  approvedAmount?: string | number | null;
  termMonths?: number | null;
  createdAt: string;
  dealerUnit: Pick<DealerUnit, "id" | "code" | "vin" | "brand" | "model">;
}
