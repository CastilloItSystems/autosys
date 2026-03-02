// frontend/types/serialNumber.interface.ts

export enum SerialStatus {
  IN_STOCK = "IN_STOCK",
  SOLD = "SOLD",
  DEFECTIVE = "DEFECTIVE",
  WARRANTY = "WARRANTY",
  LOANED = "LOANED",
}

export interface SerialNumber {
  id: string;
  serialNumber: string;
  sku: string;
  itemId: string;
  status: SerialStatus;
  warehouse?: {
    id: string;
    name: string;
  };
  warehouseId?: string;
  batch?: {
    id: string;
    batchNumber: string;
    expiryDate: Date;
  };
  batchId?: string;
  purchaseOrderNumber?: string;
  location?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSerialNumberInput {
  serialNumber: string;
  sku: string;
  itemId: string;
  warehouseId?: string;
  batchId?: string;
  purchaseOrderNumber?: string;
  location?: string;
  notes?: string;
}

export interface UpdateSerialNumberInput {
  status?: SerialStatus;
  warehouseId?: string;
  location?: string;
  notes?: string;
}

export interface SerialNumberFilters {
  itemId?: string;
  sku?: string;
  status?: SerialStatus;
  warehouseId?: string;
  serialNumber?: string;
}

export interface SerialNumberListResponse {
  data: SerialNumber[];
  total: number;
  page: number;
  limit: number;
}

// Timeline/Journey Tracking
export interface SerialNumberEvent {
  id: string;
  type: string;
  eventType: string;
  status?: SerialStatus;
  warehouse?: {
    id: string;
    name: string;
  };
  warehouseId?: string;
  location?: string;
  notes?: string;
  createdBy?: string;
  createdAt: Date;
}

export interface SerialNumberJourney {
  serialNumberId: string;
  serialNumber: string;
  events: SerialNumberEvent[];
  currentStatus: SerialStatus;
  currentWarehouse?: string;
}

export interface TimelineEvent {
  id: string;
  title: string;
  subtitle: string;
  status: "INSTOCK" | "SOLD" | "DEFECTIVE" | "WARRANTY" | "LOANED";
  icon?: string;
  color?: string;
  date: Date;
  details?: {
    warehouse?: string;
    location?: string;
    notes?: string;
  };
}

// Status Configuration
export interface StatusConfig {
  label: string;
  severity: "success" | "warning" | "danger" | "secondary" | "info";
  icon: string;
  color?: string;
}

export const SERIAL_STATUS_CONFIG: Record<SerialStatus, StatusConfig> = {
  [SerialStatus.IN_STOCK]: {
    label: "En Stock",
    severity: "success",
    icon: "pi pi-check-circle",
    color: "#28a745",
  },
  [SerialStatus.SOLD]: {
    label: "Vendido",
    severity: "info",
    icon: "pi pi-shopping-cart",
    color: "#007bff",
  },
  [SerialStatus.DEFECTIVE]: {
    label: "Defectuoso",
    severity: "danger",
    icon: "pi pi-times-circle",
    color: "#dc3545",
  },
  [SerialStatus.WARRANTY]: {
    label: "En Garantía",
    severity: "warning",
    icon: "pi pi-shield",
    color: "#ffc107",
  },
  [SerialStatus.LOANED]: {
    label: "Prestado",
    severity: "secondary",
    icon: "pi pi-arrow-right-arrow-left",
    color: "#6c757d",
  },
};

// Helper function to convert to timeline event
export const serialEventToTimelineEvent = (
  event: SerialNumberEvent,
): TimelineEvent => {
  const statusMap: Record<string, SerialStatus> = {
    SERIAL_CREATED: SerialStatus.IN_STOCK,
    SERIAL_STATUS_CHANGED: event.status || SerialStatus.IN_STOCK,
    SERIAL_ASSIGNED_LOCATION: SerialStatus.IN_STOCK,
  };

  const status = statusMap[event.eventType] || SerialStatus.IN_STOCK;
  const config = SERIAL_STATUS_CONFIG[status];

  return {
    id: event.id,
    title: getTitleForEventType(event.eventType),
    subtitle: getSubtitleForEvent(event),
    status: "INSTOCK", // Base status for timeline display
    icon: config.icon,
    color: config.color,
    date: new Date(event.createdAt),
    details: {
      warehouse: event.warehouse?.name || event.warehouseId,
      location: event.location,
      notes: event.notes,
    },
  };
};

const getTitleForEventType = (eventType: string): string => {
  const titles: Record<string, string> = {
    SERIAL_CREATED: "Número de Serie Creado",
    SERIAL_STATUS_CHANGED: "Estado Cambiado",
    SERIAL_ASSIGNED_LOCATION: "Ubicación Asignada",
  };
  return titles[eventType] || "Evento";
};

const getSubtitleForEvent = (event: SerialNumberEvent): string => {
  if (event.status) {
    const config = SERIAL_STATUS_CONFIG[event.status];
    return config.label;
  }
  if (event.location) {
    return `Ubicación: ${event.location}`;
  }
  return event.eventType;
};
