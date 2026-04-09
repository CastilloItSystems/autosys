// backend/src/features/inventory/suppliers/suppliers.dto.ts

import { SupplierType, ISupplier } from './suppliers.interface.js'

export class CreateSupplierDTO {
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

  constructor(data: Record<string, unknown>) {
    this.code = (data.code as string).toUpperCase()
    this.name = data.name as string
    if (data.contactName !== undefined)
      this.contactName = data.contactName as string
    if (data.email !== undefined) this.email = data.email as string
    if (data.phone !== undefined) this.phone = data.phone as string
    if (data.mobile !== undefined) this.mobile = data.mobile as string
    if (data.website !== undefined) this.website = data.website as string
    if (data.address !== undefined) this.address = data.address as string
    if (data.taxId !== undefined) this.taxId = data.taxId as string
    if (data.type !== undefined) this.type = data.type as SupplierType
    if (data.isSpecialTaxpayer !== undefined)
      this.isSpecialTaxpayer = data.isSpecialTaxpayer as boolean
    if (data.creditDays !== undefined)
      this.creditDays = data.creditDays as number
    if (data.currency !== undefined) this.currency = data.currency as string
    if (data.notes !== undefined) this.notes = data.notes as string
    if (data.metadata !== undefined) this.metadata = data.metadata
  }
}

export class UpdateSupplierDTO {
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

  constructor(data: Record<string, unknown>) {
    if (data.code !== undefined) this.code = (data.code as string).toUpperCase()
    if (data.name !== undefined) this.name = data.name as string
    if (data.contactName !== undefined)
      this.contactName = (data.contactName as string | null) ?? null
    if (data.email !== undefined)
      this.email = (data.email as string | null) ?? null
    if (data.phone !== undefined)
      this.phone = (data.phone as string | null) ?? null
    if (data.mobile !== undefined)
      this.mobile = (data.mobile as string | null) ?? null
    if (data.website !== undefined)
      this.website = (data.website as string | null) ?? null
    if (data.address !== undefined)
      this.address = (data.address as string | null) ?? null
    if (data.taxId !== undefined)
      this.taxId = (data.taxId as string | null) ?? null
    if (data.type !== undefined) this.type = data.type as SupplierType
    if (data.isSpecialTaxpayer !== undefined)
      this.isSpecialTaxpayer = data.isSpecialTaxpayer as boolean
    if (data.creditDays !== undefined)
      this.creditDays = data.creditDays as number
    if (data.currency !== undefined)
      this.currency = (data.currency as string | null) ?? null
    if (data.notes !== undefined)
      this.notes = (data.notes as string | null) ?? null
    if (data.metadata !== undefined) this.metadata = data.metadata
    if (data.isActive !== undefined) this.isActive = data.isActive as boolean
  }
}

export class SupplierResponseDTO {
  id: string
  code: string
  name: string
  contactName: string | null
  email: string | null
  phone: string | null
  mobile: string | null
  website: string | null
  address: string | null
  taxId: string | null
  type: string
  isSpecialTaxpayer: boolean
  creditDays: number
  currency: string | null
  notes: string | null
  metadata: any | null
  isActive: boolean
  empresaId: string
  createdAt: Date
  updatedAt: Date

  constructor(supplier: ISupplier) {
    this.id = supplier.id
    this.code = supplier.code
    this.name = supplier.name
    this.contactName = supplier.contactName ?? null
    this.email = supplier.email ?? null
    this.phone = supplier.phone ?? null
    this.mobile = supplier.mobile ?? null
    this.website = supplier.website ?? null
    this.address = supplier.address ?? null
    this.taxId = supplier.taxId ?? null
    this.type = supplier.type
    this.isSpecialTaxpayer = supplier.isSpecialTaxpayer
    this.creditDays = supplier.creditDays
    this.currency = supplier.currency ?? null
    this.notes = supplier.notes ?? null
    this.metadata = supplier.metadata ?? null
    this.isActive = supplier.isActive
    this.empresaId = supplier.empresaId
    this.createdAt = supplier.createdAt
    this.updatedAt = supplier.updatedAt
  }
}
