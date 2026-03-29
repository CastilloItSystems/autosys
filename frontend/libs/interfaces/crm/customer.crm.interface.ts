// libs/interfaces/crm/customer.crm.interface.ts

export enum CustomerType {
  INDIVIDUAL = "INDIVIDUAL",
  COMPANY = "COMPANY",
}

export enum CustomerSegment {
  PROSPECT = "PROSPECT",
  REGULAR = "REGULAR",
  VIP = "VIP",
  WHOLESALE = "WHOLESALE",
  INACTIVE = "INACTIVE",
}

export enum CustomerChannel {
  REPUESTOS = "REPUESTOS",
  TALLER = "TALLER",
  VEHICULOS = "VEHICULOS",
  ALL = "ALL",
}

export interface CustomerContact {
  id: string;
  customerId: string;
  name: string;
  role?: string | null;
  phone?: string | null;
  mobile?: string | null;
  email?: string | null;
  isPrimary: boolean;
  notes?: string | null;
  isActive: boolean;
}

export interface CustomerVehicleSummary {
  id: string;
  plate: string;
  year?: number | null;
  color?: string | null;
  mileage?: number | null;
  brand?: { id: string; name: string } | null;
  vehicleModel?: { id: string; name: string; year?: number | null } | null;
}

export interface CustomerCrm {
  id: string;
  code: string;
  taxId?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  website?: string | null;
  contactPerson?: string | null;
  address?: string | null;
  shippingAddress?: string | null;
  billingAddress?: string | null;
  type: CustomerType | string;
  isSpecialTaxpayer: boolean;
  priceList: number;
  creditLimit: number;
  creditDays: number;
  defaultDiscount: number;
  // CRM fields
  segment: CustomerSegment | string;
  preferredChannel: CustomerChannel | string;
  assignedSellerId?: string | null;
  customerSince?: string | null;
  referredById?: string | null;
  notes?: string | null;
  metadata?: any | null;
  isActive: boolean;
  empresaId: string;
  // Relaciones incluidas
  contacts?: CustomerContact[];
  vehicles?: CustomerVehicleSummary[];
  _count?: {
    orders: number;
    leads: number;
    interactions: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Timeline 360° del cliente
export interface CustomerTimeline {
  customer: CustomerCrm;
  orders: {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
  }[];
  leads: {
    id: string;
    title: string;
    channel: string;
    status: string;
    estimatedValue?: number | null;
    createdAt: string;
    closedAt?: string | null;
  }[];
  interactions: {
    id: string;
    type: string;
    channel: string;
    subject?: string | null;
    notes: string;
    outcome?: string | null;
    createdAt: string;
    createdBy: string;
  }[];
  activities: {
    id: string;
    type: string;
    title: string;
    status: string;
    assignedTo: string;
    dueAt: string;
    completedAt?: string | null;
  }[];
  vehicles: CustomerVehicleSummary[];
  serviceOrders: {
    id: string;
    folio: string;
    status: string;
    vehiclePlate?: string | null;
    vehicleDesc?: string | null;
    mileageIn?: number | null;
    mileageOut?: number | null;
    total: number;
    receivedAt: string;
    deliveredAt?: string | null;
    customerVehicleId?: string | null;
  }[];
}

// Respuestas paginadas
export interface CustomerCrmListResponse {
  data: CustomerCrm[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CustomerCrmResponse {
  data: CustomerCrm;
}

// ── Config de UI ──────────────────────────────────────────────────────────────

export const CUSTOMER_TYPE_CONFIG = {
  INDIVIDUAL: {
    label: "Persona Natural",
    icon: "pi pi-user",
    severity: "info" as const,
  },
  COMPANY: {
    label: "Empresa",
    icon: "pi pi-building",
    severity: "success" as const,
  },
} as const;

export const CUSTOMER_SEGMENT_CONFIG = {
  PROSPECT: {
    label: "Prospecto",
    icon: "pi pi-search",
    severity: "warning" as const,
  },
  REGULAR: {
    label: "Regular",
    icon: "pi pi-user",
    severity: "info" as const,
  },
  VIP: {
    label: "VIP",
    icon: "pi pi-star-fill",
    severity: "success" as const,
  },
  WHOLESALE: {
    label: "Mayorista",
    icon: "pi pi-box",
    severity: "secondary" as const,
  },
  INACTIVE: {
    label: "Inactivo",
    icon: "pi pi-ban",
    severity: "danger" as const,
  },
} as const;

export const CUSTOMER_CHANNEL_CONFIG = {
  REPUESTOS: {
    label: "Repuestos",
    icon: "pi pi-cog",
    severity: "info" as const,
  },
  TALLER: {
    label: "Taller",
    icon: "pi pi-wrench",
    severity: "warning" as const,
  },
  VEHICULOS: {
    label: "Vehículos",
    icon: "pi pi-car",
    severity: "success" as const,
  },
  ALL: {
    label: "Todos",
    icon: "pi pi-th-large",
    severity: "secondary" as const,
  },
} as const;
