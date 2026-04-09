// ===== Enums =====

export type EntryNoteStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";
export type EntryType =
  | "RETURN"
  | "TRANSFER"
  | "WARRANTY_RETURN"
  | "LOAN_RETURN"
  | "ADJUSTMENT_IN"
  | "DONATION"
  | "SAMPLE"
  | "OTHER";

// ===== Status config =====

export const ENTRY_NOTE_STATUS_CONFIG: Record<
  EntryNoteStatus,
  {
    label: string;
    severity: "warning" | "info" | "success" | "danger";
    icon: string;
  }
> = {
  PENDING: { label: "Pendiente", severity: "warning", icon: "pi pi-clock" },
  IN_PROGRESS: {
    label: "En Proceso",
    severity: "info",
    icon: "pi pi-spin pi-spinner",
  },
  COMPLETED: {
    label: "Completada",
    severity: "success",
    icon: "pi pi-check-circle",
  },
  CANCELLED: {
    label: "Cancelada",
    severity: "danger",
    icon: "pi pi-times-circle",
  },
};

export const ENTRY_TYPE_LABELS: Record<EntryType, string> = {
  RETURN: "Devolución",
  TRANSFER: "Transferencia",
  WARRANTY_RETURN: "Devolución Garantía",
  LOAN_RETURN: "Devolución Préstamo",
  ADJUSTMENT_IN: "Ajuste Entrada",
  DONATION: "Donación",
  SAMPLE: "Muestra",
  OTHER: "Otro",
};

// Steps ordenados para el stepper (excluye CANCELLED, se maneja aparte)
export const EN_STATUS_STEPS: EntryNoteStatus[] = [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
];

// ===== Interfaces =====

export interface EntryNoteItem {
  id: string;
  entryNoteId: string;
  itemId: string;
  itemName?: string | null;
  quantityReceived: number;
  unitCost: number;
  storedToLocation?: string | null;
  batchId?: string | null;
  serialNumberId?: string | null;
  batchNumber?: string | null;
  expiryDate?: string | null;
  notes?: string | null;
  createdAt?: string;
  item?: {
    id: string;
    itemName: string;
    sku: string;
    name: string;
  };
  batch?: {
    id: string;
    batchNumber: string;
  };
  serialNumber?: {
    id: string;
    serialNumber: string;
  };
}

export interface EntryNote {
  id: string;
  entryNoteNumber: string;
  type: EntryType;
  status: EntryNoteStatus;
  purchaseOrderId?: string | null;
  warehouseId: string;
  catalogSupplierId?: string | null;
  catalogSupplier?: { id: string; name: string };
  supplierName?: string | null;
  supplierId?: string | null;
  supplierPhone?: string | null;
  reason?: string | null;
  reference?: string | null;
  notes?: string | null;
  receivedAt?: string | null;
  verifiedAt?: string | null;
  receivedBy?: string | null;
  receivedByName?: string | null;
  verifiedBy?: string | null;
  authorizedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
  purchaseOrder?: {
    id: string;
    orderNumber: string;
    supplierId: string;
    supplier?: { id: string; name: string };
  };
  warehouse?: {
    id: string;
    code: string;
    name: string;
    type?: string;
  };
  items?: EntryNoteItem[];
}
