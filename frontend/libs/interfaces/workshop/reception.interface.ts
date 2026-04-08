// libs/interfaces/workshop/reception.interface.ts
import type { CustomerRef, VehicleRef } from "./shared.interface";

export type FuelLevel =
  | "EMPTY"
  | "QUARTER"
  | "HALF"
  | "THREE_QUARTERS"
  | "FULL";

export type ReceptionStatus =
  | "OPEN"
  | "DIAGNOSING"
  | "QUOTED"
  | "CONVERTED_TO_SO"
  | "CANCELLED";

export interface VehicleReception {
  id: string;
  folio: string;
  customerId: string;
  customer: CustomerRef | null;
  customerVehicleId: string | null;
  customerVehicle: VehicleRef | null;
  vehiclePlate: string | null;
  vehicleDesc: string | null;
  mileageIn: number | null;
  fuelLevel: FuelLevel | null;
  accessories: string[] | null;
  hasPreExistingDamage: boolean;
  damageNotes: string | null;
  clientDescription: string | null;
  authorizationName: string | null;
  authorizationPhone: string | null;
  estimatedDelivery: string | null;
  advisorId: string | null;
  clientSignature: string | null;
  diagnosticAuthorized: boolean;
  status: ReceptionStatus;
  ingressMotiveId: string | null;
  ingressMotive: { id: string; name: string; code: string } | null;
  appointmentId: string | null;
  appointment: { id: string; folio: string; status: string } | null;
  serviceOrder: { id: string; folio: string; status: string } | null;
  quotations?: { id: string; quotationNumber: string; status: string; total: number }[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReceptionFilters {
  status?: ReceptionStatus;
  customerId?: string;
  advisorId?: string;
  appointmentId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CreateReceptionInput {
  customerId: string;
  customerVehicleId?: string;
  vehiclePlate?: string;
  vehicleDesc?: string;
  mileageIn?: number;
  fuelLevel?: FuelLevel;
  accessories?: string[];
  hasPreExistingDamage: boolean;
  damageNotes?: string;
  clientDescription?: string;
  authorizationName?: string;
  authorizationPhone?: string;
  estimatedDelivery?: string;
  advisorId?: string;
  appointmentId?: string;
}

export interface UpdateReceptionInput {
  mileageIn?: number;
  fuelLevel?: FuelLevel | null;
  accessories?: string[];
  hasPreExistingDamage?: boolean;
  damageNotes?: string | null;
  clientDescription?: string;
  authorizationName?: string;
  authorizationPhone?: string;
  estimatedDelivery?: string | null;
  advisorId?: string | null;
  clientSignature?: string | null;
  diagnosticAuthorized?: boolean;
}
