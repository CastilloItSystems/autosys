// backend/src/features/inventory/suppliers/suppliers.interface.ts

export interface ISupplier {
  id: string
  code: string
  name: string
  contactName?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  taxId?: string | null
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
  address?: string
  taxId?: string
}

export interface IUpdateSupplierInput {
  code?: string
  name?: string
  contactName?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  taxId?: string | null
  isActive?: boolean
}

export interface ISupplierFilters {
  code?: string
  name?: string
  isActive?: boolean
}
