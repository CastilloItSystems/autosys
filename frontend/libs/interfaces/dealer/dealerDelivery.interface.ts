import type { DealerUnit } from "./dealerUnit.interface";

export type DealerDeliveryStatus = "SCHEDULED" | "READY" | "DELIVERED" | "CANCELLED";

export interface DealerDelivery {
  id: string;
  deliveryNumber: string;
  status: DealerDeliveryStatus;
  customerName: string;
  scheduledAt: string;
  deliveredAt?: string | null;
  checklistCompleted: boolean;
  documentsSigned: boolean;
  accessoriesDelivered: boolean;
  createdAt: string;
  dealerUnit: Pick<DealerUnit, "id" | "code" | "vin" | "brand" | "model">;
}
