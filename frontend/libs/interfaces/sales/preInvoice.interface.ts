// libs/interfaces/sales/preInvoice.interface.ts

export enum PreInvoiceStatus {
  PENDING_PREPARATION = "PENDING_PREPARATION",
  IN_PREPARATION = "IN_PREPARATION",
  READY_FOR_PAYMENT = "READY_FOR_PAYMENT",
  PAID = "PAID",
  CANCELLED = "CANCELLED",
}

export interface PreInvoiceItem {
  id: string;
  preInvoiceId: string;
  itemId: string;
  itemName?: string | null;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  taxType: string;
  taxRate: number;
  taxAmount: number;
  subtotal: number;
  totalLine: number;
  batchId?: string | null;
  serialNumberId?: string | null;
  notes?: string | null;
  item?: {
    id: string;
    sku: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PreInvoice {
  id: string;
  preInvoiceNumber: string;
  status: PreInvoiceStatus;
  empresaId: string;
  orderId: string;
  customerId: string;
  warehouseId: string;
  currency: string;
  exchangeRate?: number | null;
  discountAmount: number;
  subtotalBruto: number;
  baseImponible: number;
  baseExenta: number;
  taxAmount: number;
  taxRate: number;
  igtfApplies: boolean;
  igtfRate: number;
  igtfAmount: number;
  total: number;
  notes?: string | null;
  preparedAt?: string | null;
  paidAt?: string | null;
  preparedBy?: string | null;
  items: PreInvoiceItem[];
  order?: {
    id: string;
    orderNumber: string;
    status: string;
  };
  customer?: {
    id: string;
    code: string;
    name: string;
    taxId?: string | null;
    phone?: string | null;
  };
  warehouse?: {
    id: string;
    name: string;
    code: string;
  };
  exitNote?: any;
  invoice?: any;
  createdAt: string;
  updatedAt: string;
}

export const PREINVOICE_STATUS_CONFIG = {
  [PreInvoiceStatus.PENDING_PREPARATION]: {
    label: "Pendiente",
    severity: "warning" as const,
    icon: "pi pi-clock",
  },
  [PreInvoiceStatus.IN_PREPARATION]: {
    label: "En Preparación",
    severity: "info" as const,
    icon: "pi pi-spinner",
  },
  [PreInvoiceStatus.READY_FOR_PAYMENT]: {
    label: "Lista para Pago",
    severity: "help" as const,
    icon: "pi pi-wallet",
  },
  [PreInvoiceStatus.PAID]: {
    label: "Pagada",
    severity: "success" as const,
    icon: "pi pi-check-circle",
  },
  [PreInvoiceStatus.CANCELLED]: {
    label: "Cancelada",
    severity: "danger" as const,
    icon: "pi pi-times",
  },
} as const;

export const PREINVOICE_STATUS_STEPS: PreInvoiceStatus[] = [
  PreInvoiceStatus.PENDING_PREPARATION,
  PreInvoiceStatus.IN_PREPARATION,
  PreInvoiceStatus.READY_FOR_PAYMENT,
  PreInvoiceStatus.PAID,
];
