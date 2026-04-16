import type { DealerUnit } from "./dealerUnit.interface";

export type DealerTestDriveStatus = "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "NO_SHOW" | "CANCELLED";

export interface DealerTestDrive {
  id: string;
  empresaId: string;
  dealerUnitId: string;
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
  dealerUnit: Pick<DealerUnit, "id" | "code" | "vin" | "plate" | "brand" | "model">;
}
