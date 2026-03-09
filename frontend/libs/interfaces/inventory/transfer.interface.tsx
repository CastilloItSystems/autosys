export enum TransferStatus {
  DRAFT = "DRAFT",
  PENDING_APPROVAL = "PENDING_APPROVAL",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

export const TRANSFER_STATUS_CONFIG = {
  [TransferStatus.DRAFT]: {
    label: "Borrador",
    severity: "warning" as const,
    icon: "pi pi-pencil",
  },
  [TransferStatus.PENDING_APPROVAL]: {
    label: "Pendiente Aprobación",
    severity: "warning" as const,
    icon: "pi pi-clock",
  },
  [TransferStatus.APPROVED]: {
    label: "Aprobada",
    severity: "success" as const,
    icon: "pi pi-check",
  },
  [TransferStatus.REJECTED]: {
    label: "Rechazada",
    severity: "danger" as const,
    icon: "pi pi-ban",
  },
  [TransferStatus.CANCELLED]: {
    label: "Cancelada",
    severity: "danger" as const,
    icon: "pi pi-times-circle",
  },
};

export interface TransferNoteInfo {
  id: string;
  exitNoteNumber?: string;
  entryNoteNumber?: string;
  status: string;
}

export interface TransferItem {
  id: string;
  itemId: string;
  quantity: number;
  unitCost?: number;
  notes?: string;
  item?: {
    id: string;
    name: string;
    sku?: string;
  };
}

export interface Transfer {
  id: string;
  transferNumber: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  status: TransferStatus;
  items: TransferItem[];
  notes?: string;
  approvedBy?: string;
  approvedAt?: Date | string;
  rejectedBy?: string;
  rejectedAt?: Date | string;
  rejectionReason?: string;
  exitNoteId?: string | null;
  entryNoteId?: string | null;
  exitNote?: TransferNoteInfo | null;
  entryNote?: TransferNoteInfo | null;
  createdBy?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  fromWarehouse?: {
    id: string;
    name: string;
  };
  toWarehouse?: {
    id: string;
    name: string;
  };
}

export interface CreateTransferDTO {
  fromWarehouseId: string;
  toWarehouseId: string;
  items: Array<{
    itemId: string;
    quantity: number;
    unitCost?: number;
    notes?: string;
  }>;
  notes?: string;
}

export interface UpdateTransferDTO extends Partial<CreateTransferDTO> {}

export interface TransfersResponse {
  data: Transfer[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  meta?: any;
}
