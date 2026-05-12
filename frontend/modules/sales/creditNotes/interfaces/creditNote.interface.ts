export enum CreditNoteStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  CANCELLED = "CANCELLED",
}

export interface CreditNoteItem {
  id: string;
  creditNoteId: string;
  itemId?: string | null;
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
  item?: { id: string; name: string; code: string } | null;
  createdAt: string;
}

export interface CreditNote {
  id: string;
  creditNoteNumber: string;
  status: CreditNoteStatus;
  invoiceId: string;
  customerId: string;
  reason: string;
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
  issuedBy?: string | null;
  issuedByName?: string | null;
  issuedAt?: string | null;
  cancelledAt?: string | null;
  cancelledBy?: string | null;
  cancelledByName?: string | null;
  cancellationReason?: string | null;
  items: CreditNoteItem[];
  invoice?: { id: string; invoiceNumber: string; fiscalNumber?: string | null; status: string; total: number } | null;
  customer?: { id: string; code: string; name: string; taxId?: string | null } | null;
  createdAt: string;
  updatedAt: string;
}

export const CREDIT_NOTE_STATUS_CONFIG = {
  [CreditNoteStatus.DRAFT]: { label: "Borrador", severity: "secondary" as const, icon: "pi pi-file" },
  [CreditNoteStatus.ACTIVE]: { label: "Emitida", severity: "success" as const, icon: "pi pi-check-circle" },
  [CreditNoteStatus.CANCELLED]: { label: "Anulada", severity: "danger" as const, icon: "pi pi-ban" },
} as const;
