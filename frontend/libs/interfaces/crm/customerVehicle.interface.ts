// libs/interfaces/crm/customerVehicle.interface.ts

export enum FuelType {
  GASOLINE = "GASOLINE",
  DIESEL = "DIESEL",
  ELECTRIC = "ELECTRIC",
  HYBRID = "HYBRID",
  GAS = "GAS",
}

export enum TransmissionType {
  MANUAL = "MANUAL",
  AUTOMATIC = "AUTOMATIC",
  CVT = "CVT",
}

export interface CustomerVehicle {
  id: string;
  customerId: string;
  empresaId: string;
  plate: string;
  vin?: string | null;
  brandId?: string | null;
  brand?: { id: string; name: string; code: string } | null;
  modelId?: string | null;
  vehicleModel?: { id: string; name: string; year?: number | null } | null;
  year?: number | null;
  color?: string | null;
  fuelType?: FuelType | string | null;
  transmission?: TransmissionType | string | null;
  mileage?: number | null;
  purchasedHere: boolean;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerVehicleListResponse {
  data: CustomerVehicle[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CustomerVehicleResponse {
  data: CustomerVehicle;
}

// ── Config de UI ──────────────────────────────────────────────────────────────

export const FUEL_TYPE_CONFIG = {
  GASOLINE: { label: "Gasolina", icon: "pi pi-cloud" },
  DIESEL: { label: "Diesel", icon: "pi pi-cloud-upload" },
  ELECTRIC: { label: "Eléctrico", icon: "pi pi-bolt" },
  HYBRID: { label: "Híbrido", icon: "pi pi-sync" },
  GAS: { label: "Gas", icon: "pi pi-cloud-download" },
} as const;

export const TRANSMISSION_TYPE_CONFIG = {
  MANUAL: { label: "Manual" },
  AUTOMATIC: { label: "Automático" },
  CVT: { label: "CVT" },
} as const;

export const FUEL_TYPE_OPTIONS = Object.entries(FUEL_TYPE_CONFIG).map(
  ([value, cfg]) => ({ label: cfg.label, value })
);

export const TRANSMISSION_TYPE_OPTIONS = Object.entries(
  TRANSMISSION_TYPE_CONFIG
).map(([value, cfg]) => ({ label: cfg.label, value }));
