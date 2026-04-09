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
  mobile?: string | null;
  website?: string | null;
  contactPerson?: string | null;
  address?: string | null;
  shippingAddress?: string | null;
  billingAddress?: string | null;
  type: CustomerType | "INDIVIDUAL" | "COMPANY";
  isSpecialTaxpayer: boolean;
  priceList: number;
  creditLimit: number;
  creditDays: number;
  defaultDiscount: number;
  isActive: boolean;
  empresaId: string;
  createdAt: string;
  updatedAt: string;
}

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
