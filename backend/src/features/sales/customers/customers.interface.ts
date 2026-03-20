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
  address?: string | null
  type: CustomerType
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
  address?: string | null
  type?: CustomerType
}

export interface IUpdateCustomerInput {
  code?: string
  taxId?: string | null
  name?: string
  email?: string | null
  phone?: string | null
  address?: string | null
  type?: CustomerType
  isActive?: boolean
}

export interface ICustomerFilters {
  type?: CustomerType
  isActive?: boolean
  search?: string
}
