import { Supplier } from "./supplier.interface";

export type PurchaseOrderStatus =
  | "DRAFT"
  | "SENT"
  | "PARTIAL"
  | "COMPLETED"
  | "CANCELLED";

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  itemId: string;
  quantityOrdered: number;
  quantityReceived: number;
  quantityPending: number;
  unitCost: number;
  subtotal: number;
  item?: {
    id: string;
    sku: string;
    name: string;
    description?: string;
    costPrice?: number;
    salePrice?: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  warehouseId: string;
  status: PurchaseOrderStatus;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string | null;
  orderDate?: string;
  expectedDate?: string | null;
  createdBy?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  supplier?: Supplier;
  warehouse?: {
    id: string;
    code: string;
    name: string;
    type?: string;
  };
  items?: PurchaseOrderItem[];
  createdAt?: string;
  updatedAt?: string;
}

// Labels y colores para estados
export const PO_STATUS_CONFIG: Record<
  PurchaseOrderStatus,
  {
    label: string;
    severity: "secondary" | "info" | "warning" | "success" | "danger";
    icon: string;
  }
> = {
  DRAFT: { label: "Borrador", severity: "secondary", icon: "pi pi-pencil" },
  SENT: { label: "Enviada", severity: "info", icon: "pi pi-send" },
  PARTIAL: { label: "Parcial", severity: "warning", icon: "pi pi-clock" },
  COMPLETED: { label: "Completada", severity: "success", icon: "pi pi-check" },
  CANCELLED: { label: "Cancelada", severity: "danger", icon: "pi pi-times" },
};

// Steps ordenados para el stepper
export const PO_STATUS_STEPS: PurchaseOrderStatus[] = [
  "DRAFT",
  "SENT",
  "PARTIAL",
  "COMPLETED",
];
