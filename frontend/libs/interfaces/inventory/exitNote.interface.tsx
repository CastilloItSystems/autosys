export enum ExitNoteStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  READY = "READY",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
}

export enum ExitNoteType {
  SALE = "SALE",
  WARRANTY = "WARRANTY",
  LOAN = "LOAN",
  INTERNAL_USE = "INTERNAL_USE",
  SAMPLE = "SAMPLE",
  DONATION = "DONATION",
  OWNER_PICKUP = "OWNER_PICKUP",
  DEMO = "DEMO",
  TRANSFER = "TRANSFER",
  OTHER = "OTHER",
  LOAN_RETURN = "LOAN_RETURN",
}

export interface ExitNoteItem {
  id: string;
  exitNoteId: string;
  itemId: string;
  itemName?: string | null;
  quantity: number;
  pickedFromLocation?: string;
  batchId?: string;
  serialNumberId?: string;
  notes?: string;
  item?: {
    id: string;
    sku: string;
    name: string;
  };
}

export interface ExitNote {
  id: string;
  exitNoteNumber: string;
  type: ExitNoteType;
  status: ExitNoteStatus;
  warehouseId: string;
  warehouse?: {
    id: string;
    name: string;
  };
  preInvoiceId?: string;
  recipientName?: string;
  recipientId?: string;
  recipientPhone?: string;
  reason?: string;
  reference?: string;
  expectedReturnDate?: string;
  notes?: string;
  authorizedBy?: string;
  preparedBy?: string;
  deliveredBy?: string;
  createdAt: string;
  updatedAt: string;
  items?: ExitNoteItem[];
}

export interface CreateExitNoteItem {
  itemId: string;
  itemName?: string | null;
  quantity: number;
  pickedFromLocation?: string;
  batchId?: string;
  serialNumberId?: string;
  notes?: string;
}

export interface CreateExitNote {
  type: ExitNoteType;
  warehouseId: string;
  preInvoiceId?: string;
  recipientName?: string;
  recipientId?: string;
  recipientPhone?: string;
  reason?: string;
  reference?: string;
  expectedReturnDate?: Date;
  items: CreateExitNoteItem[];
  notes?: string;
  authorizedBy?: string;
}

export interface ExitNotesResponse {
  data: ExitNote[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ExitNoteResponse {
  data: ExitNote;
}

// Status Configuration (patrón PurchaseOrder)
export const EXIT_NOTE_STATUS_CONFIG = {
  [ExitNoteStatus.PENDING]: {
    label: "Pendiente",
    severity: "warning" as const,
    icon: "pi pi-clock",
  },
  [ExitNoteStatus.IN_PROGRESS]: {
    label: "Preparando",
    severity: "info" as const,
    icon: "pi pi-cog",
  },
  [ExitNoteStatus.READY]: {
    label: "Lista",
    severity: "success" as const,
    icon: "pi pi-check",
  },
  [ExitNoteStatus.DELIVERED]: {
    label: "Entregada",
    severity: "secondary" as const,
    icon: "pi pi-check-circle",
  },
  [ExitNoteStatus.CANCELLED]: {
    label: "Cancelada",
    severity: "danger" as const,
    icon: "pi pi-times",
  },
} as const;

// Status Steps (workflow order)
export const EXIT_NOTE_STATUS_STEPS: ExitNoteStatus[] = [
  ExitNoteStatus.PENDING,
  ExitNoteStatus.IN_PROGRESS,
  ExitNoteStatus.READY,
  ExitNoteStatus.DELIVERED,
];

// Type Configuration
export const EXIT_NOTE_TYPE_CONFIG: Record<
  ExitNoteType,
  { label: string; severity: string; icon: string }
> = {
  [ExitNoteType.SALE]: {
    label: "Venta",
    severity: "info",
    icon: "pi pi-shopping-cart",
  },
  [ExitNoteType.WARRANTY]: {
    label: "Garantía",
    severity: "warning",
    icon: "pi pi-shield",
  },
  [ExitNoteType.LOAN]: {
    label: "Préstamo",
    severity: "success",
    icon: "pi pi-inbox",
  },
  [ExitNoteType.INTERNAL_USE]: {
    label: "Uso Interno",
    severity: "primary",
    icon: "pi pi-box",
  },
  [ExitNoteType.SAMPLE]: {
    label: "Muestra",
    severity: "secondary",
    icon: "pi pi-gift",
  },
  [ExitNoteType.DONATION]: {
    label: "Donación",
    severity: "secondary",
    icon: "pi pi-heart",
  },
  [ExitNoteType.OWNER_PICKUP]: {
    label: "Retiro Propietario",
    severity: "info",
    icon: "pi pi-home",
  },
  [ExitNoteType.DEMO]: {
    label: "Demostración",
    severity: "info",
    icon: "pi pi-video",
  },
  [ExitNoteType.TRANSFER]: {
    label: "Transferencia",
    severity: "primary",
    icon: "pi pi-arrow-right",
  },
  [ExitNoteType.LOAN_RETURN]: {
    label: "Retorno Préstamo",
    severity: "success",
    icon: "pi pi-arrow-left",
  },
  [ExitNoteType.OTHER]: {
    label: "Otro",
    severity: "secondary",
    icon: "pi pi-question",
  },
};
