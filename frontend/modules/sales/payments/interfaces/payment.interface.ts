// libs/interfaces/sales/payment.interface.ts

export enum PaymentMethod {
  CASH = "CASH",
  TRANSFER = "TRANSFER",
  CARD = "CARD",
  MOBILE_PAYMENT = "MOBILE_PAYMENT",
  CHECK = "CHECK",
  CREDIT = "CREDIT",
  MIXED = "MIXED",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
}

export interface PaymentDetail {
  method: PaymentMethod;
  amount: number;
  reference?: string;
  currency?: string;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  status: PaymentStatus;
  empresaId: string;
  preInvoiceId: string;
  customerId: string;
  method: PaymentMethod;
  amount: number;
  currency: string;
  exchangeRate?: number | null;
  igtfApplies: boolean;
  igtfAmount: number;
  totalWithIgtf: number;
  details?: PaymentDetail[] | null;
  reference?: string | null;
  notes?: string | null;
  processedBy?: string | null;
  processedAt: string;
  preInvoice?: {
    id: string;
    preInvoiceNumber: string;
    status: string;
    total: number;
    orderId: string;
    order?: { id: string; orderNumber: string };
  };
  customer?: {
    id: string;
    name: string;
    code: string;
    taxId?: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export const PAYMENT_METHOD_CONFIG = {
  [PaymentMethod.CASH]: {
    label: "Efectivo",
    icon: "pi pi-money-bill",
    color: "text-green-500",
  },
  [PaymentMethod.TRANSFER]: {
    label: "Transferencia",
    icon: "pi pi-arrow-right-arrow-left",
    color: "text-blue-500",
  },
  [PaymentMethod.CARD]: {
    label: "Tarjeta",
    icon: "pi pi-credit-card",
    color: "text-purple-500",
  },
  [PaymentMethod.MOBILE_PAYMENT]: {
    label: "Pago Móvil",
    icon: "pi pi-mobile",
    color: "text-cyan-500",
  },
  [PaymentMethod.CHECK]: {
    label: "Cheque",
    icon: "pi pi-file",
    color: "text-orange-500",
  },
  [PaymentMethod.CREDIT]: {
    label: "Crédito",
    icon: "pi pi-calendar",
    color: "text-yellow-600",
  },
  [PaymentMethod.MIXED]: {
    label: "Mixto",
    icon: "pi pi-th-large",
    color: "text-indigo-500",
  },
} as const;

export const PAYMENT_STATUS_CONFIG = {
  [PaymentStatus.PENDING]: {
    label: "Pendiente",
    severity: "warning" as const,
    icon: "pi pi-clock",
  },
  [PaymentStatus.COMPLETED]: {
    label: "Completado",
    severity: "success" as const,
    icon: "pi pi-check-circle",
  },
  [PaymentStatus.CANCELLED]: {
    label: "Cancelado",
    severity: "danger" as const,
    icon: "pi pi-times",
  },
  [PaymentStatus.REFUNDED]: {
    label: "Reembolsado",
    severity: "info" as const,
    icon: "pi pi-replay",
  },
} as const;

export const PAYMENT_METHOD_OPTIONS = Object.entries(PAYMENT_METHOD_CONFIG).map(
  ([value, config]) => ({
    label: config.label,
    value,
    icon: config.icon,
  }),
);
