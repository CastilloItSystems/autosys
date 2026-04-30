export enum AdjustmentStatus {
  DRAFT = "DRAFT",
  APPROVED = "APPROVED",
  APPLIED = "APPLIED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

export const ADJUSTMENT_STATUS_CONFIG = {
  [AdjustmentStatus.DRAFT]: {
    label: "Borrador",
    severity: "warning",
    icon: "pi pi-pencil",
  },
  [AdjustmentStatus.APPROVED]: {
    label: "Aprobado",
    severity: "info",
    icon: "pi pi-thumbs-up",
  },
  [AdjustmentStatus.APPLIED]: {
    label: "Aplicado",
    severity: "success",
    icon: "pi pi-check-circle",
  },
  [AdjustmentStatus.REJECTED]: {
    label: "Rechazado",
    severity: "danger",
    icon: "pi pi-times-circle",
  },
  [AdjustmentStatus.CANCELLED]: {
    label: "Cancelado",
    severity: "secondary",
    icon: "pi pi-ban",
  },
};

export interface AdjustmentItem {
  id: string;
  itemId: string;
  quantityChange: number;
  unitCost?: number;
  notes?: string;
}

export interface Adjustment {
  id: string;
  adjustmentNumber: string;
  warehouseId: string;
  status: AdjustmentStatus;
  reason: string;
  items: AdjustmentItem[];
  notes?: string;
  approvedAt?: Date;
  appliedAt?: Date;
  approvedBy?: string;
  appliedBy?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAdjustmentDTO {
  warehouseId: string;
  reason: string;
  items: Array<{
    itemId: string;
    quantityChange: number;
    unitCost?: number;
    notes?: string;
  }>;
  notes?: string;
}

export interface UpdateAdjustmentDTO extends Partial<CreateAdjustmentDTO> {}

export interface AdjustmentsResponse {
  data: Adjustment[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  meta?: any;
}
