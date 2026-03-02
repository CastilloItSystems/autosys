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
  createdAt: Date
  updatedAt: Date
}

export interface ICreateSupplierInput {
  code: string
  name: string
  contactName?: string | undefined
  email?: string | undefined
  phone?: string | undefined
  address?: string | undefined
  taxId?: string | undefined
}

export interface IUpdateSupplierInput {
  code?: string | undefined
  name?: string | undefined
  contactName?: string | null | undefined
  email?: string | null | undefined
  phone?: string | null | undefined
  address?: string | null | undefined
  taxId?: string | null | undefined
  isActive?: boolean | undefined
}

export interface ISupplierFilters {
  code?: string
  name?: string
  isActive?: boolean
}
