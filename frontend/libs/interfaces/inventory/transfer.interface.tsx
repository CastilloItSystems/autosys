export enum TransferStatus {
  DRAFT = "DRAFT",
  IN_TRANSIT = "IN_TRANSIT",
  RECEIVED = "RECEIVED",
  CANCELLED = "CANCELLED",
}

export const TRANSFER_STATUS_CONFIG = {
  [TransferStatus.DRAFT]: {
    label: "Borrador",
    severity: "warning" as const,
    icon: "pi pi-pencil",
  },
  [TransferStatus.IN_TRANSIT]: {
    label: "En Tránsito",
    severity: "info" as const,
    icon: "pi pi-arrow-right",
  },
  [TransferStatus.RECEIVED]: {
    label: "Recibida",
    severity: "success" as const,
    icon: "pi pi-check-circle",
  },
  [TransferStatus.CANCELLED]: {
    label: "Cancelada",
    severity: "danger" as const,
    icon: "pi pi-times-circle",
  },
};

export interface TransferItem {
  id: string;
  itemId: string;
  quantity: number;
  unitCost?: number;
  notes?: string;
}

export interface Transfer {
  id: string;
  transferNumber: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  status: TransferStatus;
  items: TransferItem[];
  notes?: string;
  sentAt?: Date | string;
  receivedAt?: Date | string;
  sentBy?: string;
  receivedBy?: string;
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
