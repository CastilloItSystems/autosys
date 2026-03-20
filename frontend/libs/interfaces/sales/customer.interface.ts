// libs/interfaces/sales/customer.interface.ts

export enum CustomerType {
  INDIVIDUAL = "INDIVIDUAL",
  COMPANY = "COMPANY",
}

export interface Customer {
  id: string;
  code: string;
  taxId?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  type: CustomerType;
  isActive: boolean;
  empresaId: string;
  createdAt: string;
  updatedAt: string;
}

export const CUSTOMER_TYPE_CONFIG = {
  [CustomerType.INDIVIDUAL]: {
    label: "Persona Natural",
    icon: "pi pi-user",
    severity: "info" as const,
  },
  [CustomerType.COMPANY]: {
    label: "Empresa",
    icon: "pi pi-building",
    severity: "success" as const,
  },
} as const;
