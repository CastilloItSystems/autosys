import type { DealerUnit } from "./dealerUnit.interface";

export type DealerDeliveryStatus = "SCHEDULED" | "READY" | "DELIVERED" | "CANCELLED";

export interface DealerDelivery {
  id: string;
  customerId: string;
  deliveryNumber: string;
  status: DealerDeliveryStatus;
  customerName: string;
  scheduledAt: string;
  deliveredAt?: string | null;
  checklistCompleted: boolean;
  documentsSigned: boolean;
  accessoriesDelivered: boolean;
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
