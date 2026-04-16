import type { DealerUnit } from "./dealerUnit.interface";

export type DealerTradeInStatus = "PENDING" | "INSPECTED" | "VALUED" | "APPROVED" | "REJECTED" | "APPLIED";

export interface DealerTradeIn {
  id: string;
  tradeInNumber: string;
  status: DealerTradeInStatus;
  customerName: string;
  vehicleBrand: string;
  vehicleModel?: string | null;
  requestedValue?: string | number | null;
  appraisedValue?: string | number | null;
  approvedValue?: string | number | null;
  createdAt: string;
  targetDealerUnit?: Pick<DealerUnit, "id" | "code" | "vin" | "brand" | "model"> | null;
}
