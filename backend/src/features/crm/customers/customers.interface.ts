// backend/src/features/crm/customers/customers.interface.ts

export enum CustomerType {
  INDIVIDUAL = 'INDIVIDUAL',
  COMPANY = 'COMPANY',
}

export enum CustomerSegment {
  PROSPECT = 'PROSPECT',
  REGULAR = 'REGULAR',
  VIP = 'VIP',
  WHOLESALE = 'WHOLESALE',
  INACTIVE = 'INACTIVE',
}

export enum CustomerChannel {
  REPUESTOS = 'REPUESTOS',
  TALLER = 'TALLER',
  VEHICULOS = 'VEHICULOS',
  ALL = 'ALL',
}

export interface ICustomer {
  id: string
  code: string
  taxId?: string | null
  name: string
  email?: string | null
  phone?: string | null
  mobile?: string | null
  website?: string | null
  contactPerson?: string | null
  address?: string | null
  shippingAddress?: string | null
  billingAddress?: string | null
  type: CustomerType
  isSpecialTaxpayer: boolean
  priceList: number
  creditLimit: number
  creditDays: number
  defaultDiscount: number
  segment: CustomerSegment
  preferredChannel: CustomerChannel
  assignedSellerId?: string | null
  customerSince?: Date | null
  referredById?: string | null
  notes?: string | null
  metadata?: any | null
  isActive: boolean
  empresaId: string
  createdAt: Date
  updatedAt: Date
}

export interface ICustomerFilters {
  type?: string
  segment?: string
  preferredChannel?: string
  isActive?: boolean
  assignedSellerId?: string
  search?: string
}
