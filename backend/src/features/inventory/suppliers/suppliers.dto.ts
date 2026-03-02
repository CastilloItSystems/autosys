// backend/src/features/inventory/suppliers/suppliers.dto.ts

import { ISupplier } from './suppliers.interface'

export class CreateSupplierDTO {
  code: string
  name: string
  contactName?: string | undefined
  email?: string | undefined
  phone?: string | undefined
  address?: string | undefined
  taxId?: string | undefined

  constructor(data: any) {
    this.code = data.code
    this.name = data.name
    this.contactName = data.contactName
    this.email = data.email
    this.phone = data.phone
    this.address = data.address
    this.taxId = data.taxId
  }
}

export class UpdateSupplierDTO {
  code?: string | undefined
  name?: string | undefined
  contactName?: string | null | undefined
  email?: string | null | undefined
  phone?: string | null | undefined
  address?: string | null | undefined
  taxId?: string | null | undefined
  isActive?: boolean | undefined

  constructor(data: any) {
    if (data.code !== undefined) this.code = data.code
    if (data.name !== undefined) this.name = data.name
    if (data.contactName !== undefined)
      this.contactName = data.contactName ?? null
    if (data.email !== undefined) this.email = data.email ?? null
    if (data.phone !== undefined) this.phone = data.phone ?? null
    if (data.address !== undefined) this.address = data.address ?? null
    if (data.taxId !== undefined) this.taxId = data.taxId ?? null
    if (data.isActive !== undefined) this.isActive = data.isActive
  }
}

export class SupplierResponseDTO {
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
    this.createdAt = supplier.createdAt
    this.updatedAt = supplier.updatedAt
  }
}
