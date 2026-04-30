export enum ReconciliationStatus {
  DRAFT = "DRAFT",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  APPROVED = "APPROVED",
  APPLIED = "APPLIED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

export enum ReconciliationSource {
  CYCLE_COUNT = "CYCLE_COUNT",
  PHYSICAL_INVENTORY = "PHYSICAL_INVENTORY",
  SYSTEM_ERROR = "SYSTEM_ERROR",
  ADJUSTMENT = "ADJUSTMENT",
  OTHER = "OTHER",
}

export const RECONCILIATION_STATUS_CONFIG = {
  [ReconciliationStatus.DRAFT]: {
    label: "Borrador",
    severity: "warning" as const,
    icon: "pi pi-pencil",
  },
  [ReconciliationStatus.IN_PROGRESS]: {
    label: "En Progreso",
    severity: "info" as const,
    icon: "pi pi-spinner",
  },
  [ReconciliationStatus.COMPLETED]: {
    label: "Completada",
    severity: "info" as const,
    icon: "pi pi-check",
  },
  [ReconciliationStatus.APPROVED]: {
    label: "Aprobada",
    severity: "success" as const,
    icon: "pi pi-thumbs-up",
  },
  [ReconciliationStatus.APPLIED]: {
    label: "Aplicada",
    severity: "success" as const,
    icon: "pi pi-check-circle",
  },
  [ReconciliationStatus.REJECTED]: {
    label: "Rechazada",
    severity: "danger" as const,
    icon: "pi pi-times-circle",
  },
  [ReconciliationStatus.CANCELLED]: {
    label: "Cancelada",
    severity: "secondary" as const,
    icon: "pi pi-ban",
  },
};

export const RECONCILIATION_SOURCE_CONFIG = {
  [ReconciliationSource.CYCLE_COUNT]: {
    label: "Conteo Cíclico",
    icon: "pi pi-list-check",
  },
  [ReconciliationSource.PHYSICAL_INVENTORY]: {
    label: "Inventario Físico",
    icon: "pi pi-inbox",
  },
  [ReconciliationSource.SYSTEM_ERROR]: {
    label: "Error del Sistema",
    icon: "pi pi-exclamation-triangle",
  },
  [ReconciliationSource.ADJUSTMENT]: {
    label: "Ajuste",
    icon: "pi pi-sliders-h",
  },
  [ReconciliationSource.OTHER]: {
    label: "Otro",
    icon: "pi pi-ellipsis-h",
  },
};

export interface ReconciliationItem {
  id: string;
  itemId: string;
  systemQuantity: number;
  expectedQuantity: number;
  difference?: number;
  notes?: string;
}

export interface Reconciliation {
  id: string;
  reconciliationNumber: string;
  warehouseId: string;
  status: ReconciliationStatus;
  source?: ReconciliationSource;
  items: ReconciliationItem[];
  notes?: string;
  startedAt?: Date | string;
  completedAt?: Date | string;
  approvedAt?: Date | string;
  appliedAt?: Date | string;
  startedBy?: string;
  completedBy?: string;
  approvedBy?: string;
  appliedBy?: string;
  createdBy?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  warehouse?: {
    id: string;
    name: string;
  };
}

export interface CreateReconciliationDTO {
  warehouseId: string;
  source?: ReconciliationSource;
  items: Array<{
    itemId: string;
    systemQuantity: number;
    expectedQuantity: number;
    notes?: string;
  }>;
  notes?: string;
}

export interface UpdateReconciliationDTO
  extends Partial<CreateReconciliationDTO> {}

export interface ReconciliationsResponse {
  data: Reconciliation[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  meta?: any;
}
export enum CreateAllowedRoles {
  WAREHOUSE_MANAGER = "WAREHOUSE_MANAGER",
  SUPERVISOR = "SUPERVISOR",
  ADMIN = "ADMIN",
}
