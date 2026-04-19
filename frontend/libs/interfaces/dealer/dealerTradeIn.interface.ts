import type { DealerUnit } from "./dealerUnit.interface";

export type DealerTradeInStatus = "PENDING" | "INSPECTED" | "VALUED" | "APPROVED" | "REJECTED" | "APPLIED";

export interface DealerTradeIn {
  id: string;
  customerId: string;
  tradeInNumber: string;
  status: DealerTradeInStatus;
  customerName: string;
  vehicleBrand: string;
  vehicleModel?: string | null;
  requestedValue?: string | number | null;
  appraisedValue?: string | number | null;
  approvedValue?: string | number | null;
  createdAt: string;
  customer: {
    id: string;
    code: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    taxId?: string | null;
  };
  targetDealerUnit?: Pick<DealerUnit, "id" | "code" | "vin" | "brand" | "model"> | null;
}
