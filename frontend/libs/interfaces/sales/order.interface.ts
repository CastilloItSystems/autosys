// libs/interfaces/sales/order.interface.ts

export enum OrderStatus {
  DRAFT = "DRAFT",
  PENDING_APPROVAL = "PENDING_APPROVAL",
  APPROVED = "APPROVED",
  CANCELLED = "CANCELLED",
}

export enum OrderCurrency {
  USD = "USD",
  VES = "VES",
  EUR = "EUR",
}

export interface OrderItem {
  id: string;
  orderId: string;
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
  notes?: string | null;
  item?: {
    id: string;
    sku: string;
    name: string;
    salePrice?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  empresaId: string;
  customerId: string;
  warehouseId: string;
  currency: OrderCurrency;
  exchangeRate?: number | null;
  exchangeRateSource?: string | null;
  paymentTerms?: string | null;
  creditDays?: number | null;
  deliveryTerms?: string | null;
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
  orderDate: string;
  approvedAt?: string | null;
  createdBy?: string | null;
  approvedBy?: string | null;
  items: OrderItem[];
  customer?: {
    id: string;
    code: string;
    name: string;
    taxId?: string | null;
    email?: string | null;
    phone?: string | null;
    type: string;
  };
  warehouse?: {
    id: string;
    name: string;
    code: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface OrdersResponse {
  data: Order[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface OrderResponse {
  data: Order;
}

// ── Status Config ──
export const ORDER_STATUS_CONFIG = {
  [OrderStatus.DRAFT]: {
    label: "Borrador",
    severity: "warning" as const,
    icon: "pi pi-pencil",
  },
  [OrderStatus.PENDING_APPROVAL]: {
    label: "Pendiente Aprobación",
    severity: "info" as const,
    icon: "pi pi-clock",
  },
  [OrderStatus.APPROVED]: {
    label: "Aprobada",
    severity: "success" as const,
    icon: "pi pi-check-circle",
  },
  [OrderStatus.CANCELLED]: {
    label: "Cancelada",
    severity: "danger" as const,
    icon: "pi pi-times",
  },
} as const;

export const ORDER_STATUS_STEPS: OrderStatus[] = [
  OrderStatus.DRAFT,
  OrderStatus.APPROVED,
];

export const ORDER_CURRENCY_LABELS: Record<OrderCurrency, string> = {
  [OrderCurrency.USD]: "USD ($)",
  [OrderCurrency.VES]: "VES (Bs.)",
  [OrderCurrency.EUR]: "EUR (€)",
};

export const TAX_TYPE_OPTIONS = [
  { label: "IVA 16%", value: "IVA" },
  { label: "Exento", value: "EXEMPT" },
  { label: "Reducido 8%", value: "REDUCED" },
];
