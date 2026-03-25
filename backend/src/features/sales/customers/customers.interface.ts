// backend/src/features/sales/customers/customers.interface.ts

export enum CustomerType {
  INDIVIDUAL = 'INDIVIDUAL',
  COMPANY = 'COMPANY',
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
  sellerId?: string | null
  notes?: string | null
  metadata?: any | null
  isActive: boolean
  empresaId: string
  createdAt: Date
  updatedAt: Date
}

export interface ICreateCustomerInput {
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
  type?: CustomerType
  isSpecialTaxpayer?: boolean
  priceList?: number
  creditLimit?: number
  creditDays?: number
  defaultDiscount?: number
  sellerId?: string | null
  notes?: string | null
  metadata?: any | null
}

export interface IUpdateCustomerInput {
  code?: string
  taxId?: string | null
  name?: string
  email?: string | null
  phone?: string | null
  mobile?: string | null
  website?: string | null
  contactPerson?: string | null
  address?: string | null
  shippingAddress?: string | null
  billingAddress?: string | null
  type?: CustomerType
  isSpecialTaxpayer?: boolean
  priceList?: number
  creditLimit?: number
  creditDays?: number
  defaultDiscount?: number
  sellerId?: string | null
  notes?: string | null
  metadata?: any | null
  isActive?: boolean
}

export interface ICustomerFilters {
  type?: CustomerType
  isActive?: boolean
  search?: string
}
