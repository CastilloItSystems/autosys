import type { DealerUnit } from "./dealerUnit.interface";

export type DealerTestDriveStatus = "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "NO_SHOW" | "CANCELLED";

export interface DealerTestDrive {
  id: string;
  empresaId: string;
  dealerUnitId: string;
  customerId: string;
  testDriveNumber: string;
  status: DealerTestDriveStatus;
  customerName: string;
  customerDocument?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  driverLicense?: string | null;
  scheduledAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  advisorName?: string | null;
  routeDescription?: string | null;
  observations?: string | null;
  customerFeedback?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    code: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    taxId?: string | null;
  };
  dealerUnit: Pick<DealerUnit, "id" | "code" | "vin" | "plate" | "brand" | "model">;
}
