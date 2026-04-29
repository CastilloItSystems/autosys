import type { DealerUnit } from "@/modules/concesionario/vehicles/interfaces/dealerUnit.interface";

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
  customerId: string;
  financingNumber: string;
  status: DealerFinancingStatus;
  customerName: string;
  currency: "USD" | "VES" | "EUR";
  exchangeRate?: string | number | null;
  exchangeRateSource?: "BCV_AUTO" | "MANUAL" | null;
  requestedAmount?: string | number | null;
  approvedAmount?: string | number | null;
  termMonths?: number | null;
  createdAt: string;
  customer: {
    id: string;
    code: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    taxId?: string | null;
  };
  dealerUnit: Pick<DealerUnit, "id" | "code" | "vin" | "brand" | "model">;
}
