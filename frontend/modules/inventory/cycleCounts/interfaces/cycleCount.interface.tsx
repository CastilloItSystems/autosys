export enum CycleCountStatus {
  DRAFT = "DRAFT",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  APPROVED = "APPROVED",
  APPLIED = "APPLIED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

export const CYCLE_COUNT_STATUS_CONFIG = {
  [CycleCountStatus.DRAFT]: {
    label: "Borrador",
    severity: "warning" as const,
    icon: "pi pi-pencil",
  },
  [CycleCountStatus.IN_PROGRESS]: {
    label: "En Progreso",
    severity: "info" as const,
    icon: "pi pi-spinner",
  },
  [CycleCountStatus.COMPLETED]: {
    label: "Completado",
    severity: "info" as const,
    icon: "pi pi-check",
  },
  [CycleCountStatus.APPROVED]: {
    label: "Aprobado",
    severity: "success" as const,
    icon: "pi pi-thumbs-up",
  },
  [CycleCountStatus.APPLIED]: {
    label: "Aplicado",
    severity: "success" as const,
    icon: "pi pi-check-circle",
  },
  [CycleCountStatus.REJECTED]: {
    label: "Rechazado",
    severity: "danger" as const,
    icon: "pi pi-times-circle",
  },
  [CycleCountStatus.CANCELLED]: {
    label: "Cancelado",
    severity: "secondary" as const,
    icon: "pi pi-ban",
  },
};

export interface CycleCountItem {
  id: string;
  itemId: string;
  expectedQuantity: number;
  countedQuantity?: number;
  variance?: number;
  location?: string;
  notes?: string;
}

export interface CycleCount {
  id: string;
  cycleCountNumber: string;
  warehouseId: string;
  status: CycleCountStatus;
  items: CycleCountItem[];
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

export interface CreateCycleCountDTO {
  warehouseId: string;
  items: Array<{
    itemId: string;
    expectedQuantity: number;
    location?: string;
    notes?: string;
  }>;
  notes?: string;
}

export interface UpdateCycleCountDTO extends Partial<CreateCycleCountDTO> {}

export interface CycleCountsResponse {
  data: CycleCount[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  meta?: any;
}

export enum CycleCountCreateAllowedRoles {
  WAREHOUSE_MANAGER = "WAREHOUSE_MANAGER",
  SUPERVISOR = "SUPERVISOR",
  ADMIN = "ADMIN",
}
