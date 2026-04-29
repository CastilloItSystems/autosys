// libs/interfaces/sales/invoice.interface.ts

export enum InvoiceStatus {
  ACTIVE = "ACTIVE",
  CANCELLED = "CANCELLED",
  CREDITED = "CREDITED",
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
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
  item?: { id: string; sku: string; name: string };
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  fiscalNumber?: string | null;
  status: InvoiceStatus;
  preInvoiceId: string;
  paymentId: string;
  customerId: string;
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
  invoiceDate: string;
  issuedBy?: string | null;
  cancelledAt?: string | null;
  cancelledBy?: string | null;
  cancellationReason?: string | null;
  items: InvoiceItem[];
  preInvoice?: {
    id: string;
    preInvoiceNumber: string;
    orderId: string;
    order?: { id: string; orderNumber: string };
  };
  payment?: {
    id: string;
    paymentNumber: string;
    method: string;
    amount: number;
  };
  customer?: {
    id: string;
    code: string;
    name: string;
    taxId?: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export const INVOICE_STATUS_CONFIG = {
  [InvoiceStatus.ACTIVE]: {
    label: "Activa",
    severity: "success" as const,
    icon: "pi pi-check-circle",
  },
  [InvoiceStatus.CANCELLED]: {
    label: "Anulada",
    severity: "danger" as const,
    icon: "pi pi-times",
  },
  [InvoiceStatus.CREDITED]: {
    label: "Con nota de crédito",
    severity: "warning" as const,
    icon: "pi pi-file",
  },
} as const;
