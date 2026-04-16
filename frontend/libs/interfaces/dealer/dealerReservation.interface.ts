import type { DealerUnit } from "./dealerUnit.interface";

export type DealerReservationStatus = "PENDING" | "CONFIRMED" | "EXPIRED" | "CANCELLED" | "CONVERTED";

export interface DealerReservation {
  id: string;
  empresaId: string;
  dealerUnitId: string;
  reservationNumber: string;
  status: DealerReservationStatus;
  customerName: string;
  customerDocument?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  offeredPrice?: string | number | null;
  depositAmount?: string | number | null;
  currency?: string | null;
  reservedAt: string;
  expiresAt?: string | null;
  confirmedAt?: string | null;
  cancelledAt?: string | null;
  convertedAt?: string | null;
  notes?: string | null;
  sourceChannel?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  dealerUnit: Pick<DealerUnit, "id" | "code" | "vin" | "plate" | "status" | "brand" | "model">;
}
