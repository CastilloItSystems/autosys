export enum ReservationStatus {
  ACTIVE = "ACTIVE",
  PENDING_PICKUP = "PENDING_PICKUP",
  CONSUMED = "CONSUMED",
  RELEASED = "RELEASED",
}

export interface ReservationItem {
  id: string;
  sku: string;
  name: string;
}

export interface ReservationExitNote {
  id: string;
  exitNoteNumber: string;
}

export interface Reservation {
  id: string;
  reservationNumber: string;
  itemId: string;
  warehouseId: string;
  quantity: number;
  status: ReservationStatus;
  workOrderId?: string;
  saleOrderId?: string;
  exitNoteId?: string;
  reference?: string;
  notes?: string;
  expiresAt?: string | null;
  deliveredAt?: string | null;
  releasedAt?: string | null;
  createdBy?: string;
  deliveredBy?: string;
  createdAt: string;
  updatedAt: string;
  // Optional nested data (populated in getOne, create, consume, release)
  item?: ReservationItem;
  exitNote?: ReservationExitNote;
}

export interface ReservationsResponse {
  data: Reservation[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ReservationResponse {
  data: Reservation;
}

// Status Configuration (patrón PurchaseOrder)
export const RESERVATION_STATUS_CONFIG = {
  [ReservationStatus.ACTIVE]: {
    label: "Activa",
    severity: "success" as const,
    icon: "pi pi-check-circle",
  },
  [ReservationStatus.PENDING_PICKUP]: {
    label: "Pendiente Retiro",
    severity: "warning" as const,
    icon: "pi pi-clock",
  },
  [ReservationStatus.CONSUMED]: {
    label: "Consumida",
    severity: "info" as const,
    icon: "pi pi-check",
  },
  [ReservationStatus.RELEASED]: {
    label: "Liberada",
    severity: "secondary" as const,
    icon: "pi pi-arrow-left",
  },
} as const;
