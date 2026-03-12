// backend/src/features/inventory/suppliers/suppliers.dto.ts

import { ISupplier } from './suppliers.interface.js'

export class CreateSupplierDTO {
  code: string
  name: string
  contactName?: string
  email?: string
  phone?: string
  address?: string
  taxId?: string

  constructor(data: Record<string, unknown>) {
    this.code = (data.code as string).toUpperCase()
    this.name = data.name as string
    if (data.contactName !== undefined)
      this.contactName = data.contactName as string
    if (data.email !== undefined) this.email = data.email as string
    if (data.phone !== undefined) this.phone = data.phone as string
    if (data.address !== undefined) this.address = data.address as string
    if (data.taxId !== undefined) this.taxId = data.taxId as string
  }
}

export class UpdateSupplierDTO {
  code?: string
  name?: string
  contactName?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  taxId?: string | null
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
    if (data.address !== undefined)
      this.address = (data.address as string | null) ?? null
    if (data.taxId !== undefined)
      this.taxId = (data.taxId as string | null) ?? null
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
  address: string | null
  taxId: string | null
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
    this.address = supplier.address ?? null
    this.taxId = supplier.taxId ?? null
    this.isActive = supplier.isActive
    this.empresaId = supplier.empresaId
    this.createdAt = supplier.createdAt
    this.updatedAt = supplier.updatedAt
  }
}
