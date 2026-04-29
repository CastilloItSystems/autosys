import type { DealerUnit } from "@/modules/concesionario/vehicles/interfaces/dealerUnit.interface";

export type DealerReservationStatus = "PENDING" | "CONFIRMED" | "EXPIRED" | "CANCELLED" | "CONVERTED";

export interface DealerReservation {
  id: string;
  empresaId: string;
  dealerUnitId: string;
  customerId: string;
  reservationNumber: string;
  status: DealerReservationStatus;
  customerName: string;
  customerDocument?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  offeredPrice?: string | number | null;
  depositAmount?: string | number | null;
  currency: "USD" | "VES" | "EUR";
  exchangeRate?: string | number | null;
  exchangeRateSource?: "BCV_AUTO" | "MANUAL" | null;
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
  customer: {
    id: string;
    code: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    taxId?: string | null;
  };
  dealerUnit: Pick<DealerUnit, "id" | "code" | "vin" | "plate" | "status" | "brand" | "model">;
}
