// frontend/types/batch.interface.ts

export enum BatchStatus {
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  EXPIRING_SOON = "EXPIRING_SOON",
  INACTIVE = "INACTIVE",
}

export interface Batch {
  id: string;
  sku: string;
  itemId: string;
  quantity: number;
  quantityUsed: number;
  quantityRemaining: number;
  batchNumber: string;
  manufactureDate: Date;
  expiryDate: Date;
  warehouse?: {
    id: string;
    name: string;
  };
  warehouseId?: string;
  status: BatchStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBatchInput {
  sku: string;
  itemId: string;
  quantity: number;
  batchNumber: string;
  manufactureDate: Date;
  expiryDate: Date;
  warehouseId?: string;
  notes?: string;
}

export interface UpdateBatchInput {
  quantity?: number;
  quantityUsed?: number;
  warehouseId?: string;
  notes?: string;
  status?: BatchStatus;
}

export interface BatchFilters {
  itemId?: string;
  sku?: string;
  status?: BatchStatus;
  warehouseId?: string;
  expiryDateFrom?: Date;
  expiryDateTo?: Date;
}

export interface BatchListResponse {
  data: Batch[];
  total: number;
  page: number;
  limit: number;
}

// Status Configuration
export interface StatusConfig {
  label: string;
  severity: "success" | "warning" | "danger" | "secondary" | "info";
  icon: string;
  color?: string;
}

export const BATCH_STATUS_CONFIG: Record<BatchStatus, StatusConfig> = {
  [BatchStatus.ACTIVE]: {
    label: "Activo",
    severity: "success",
    icon: "pi pi-check-circle",
    color: "#28a745",
  },
  [BatchStatus.EXPIRING_SOON]: {
    label: "Próximo a Vencer",
    severity: "warning",
    icon: "pi pi-exclamation-triangle",
    color: "#ffc107",
  },
  [BatchStatus.EXPIRED]: {
    label: "Vencido",
    severity: "danger",
    icon: "pi pi-times-circle",
    color: "#dc3545",
  },
  [BatchStatus.INACTIVE]: {
    label: "Inactivo",
    severity: "secondary",
    icon: "pi pi-circle-fill",
    color: "#6c757d",
  },
};

// Helper function to determine batch expiry status
export const getBatchExpiryStatus = (
  expiryDate: Date,
  threshold: number = 30,
): BatchStatus => {
  const today = new Date();
  const daysUntilExpiry = Math.floor(
    (new Date(expiryDate).getTime() - today.getTime()) / (1000 * 3600 * 24),
  );

  if (daysUntilExpiry < 0) {
    return BatchStatus.EXPIRED;
  }
  if (daysUntilExpiry <= threshold) {
    return BatchStatus.EXPIRING_SOON;
  }
  return BatchStatus.ACTIVE;
};

// Helper function to get days until expiry
export const getDaysUntilExpiry = (expiryDate: Date): number => {
  const today = new Date();
  return Math.floor(
    (new Date(expiryDate).getTime() - today.getTime()) / (1000 * 3600 * 24),
  );
};
