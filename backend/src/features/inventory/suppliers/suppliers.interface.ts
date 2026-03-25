// backend/src/features/inventory/suppliers/suppliers.interface.ts

export enum SupplierType {
  INDIVIDUAL = 'INDIVIDUAL',
  COMPANY = 'COMPANY',
}

export interface ISupplier {
  id: string
  code: string
  name: string
  contactName?: string | null
  email?: string | null
  phone?: string | null
  mobile?: string | null
  website?: string | null
  address?: string | null
  taxId?: string | null
  type: SupplierType
  isSpecialTaxpayer: boolean
  creditDays: number
  currency?: string | null
  notes?: string | null
  metadata?: any | null
  isActive: boolean
  empresaId: string
  createdAt: Date
  updatedAt: Date
}

export interface ICreateSupplierInput {
  code: string
  name: string
  contactName?: string
  email?: string
  phone?: string
  mobile?: string
  website?: string
  address?: string
  taxId?: string
  type?: SupplierType
  isSpecialTaxpayer?: boolean
  creditDays?: number
  currency?: string
  notes?: string
  metadata?: any
}

export interface IUpdateSupplierInput {
  code?: string
  name?: string
  contactName?: string | null
  email?: string | null
  phone?: string | null
  mobile?: string | null
  website?: string | null
  address?: string | null
  taxId?: string | null
  type?: SupplierType
  isSpecialTaxpayer?: boolean
  creditDays?: number
  currency?: string | null
  notes?: string | null
  metadata?: any | null
  isActive?: boolean
}

export interface ISupplierFilters {
  code?: string
  name?: string
  isActive?: boolean
}
