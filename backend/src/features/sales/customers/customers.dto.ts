// backend/src/features/sales/customers/customers.dto.ts

import { CustomerType, ICustomer } from './customers.interface.js'

export class CreateCustomerDTO {
  code: string
  taxId?: string
  name: string
  email?: string
  phone?: string
  address?: string
  type?: string

  constructor(data: Record<string, unknown>) {
    this.code = String(data.code)
    this.name = String(data.name)
    if (data.taxId != null && String(data.taxId).trim() !== '')
      this.taxId = String(data.taxId).trim()
    if (data.email != null && String(data.email).trim() !== '')
      this.email = String(data.email).trim()
    if (data.phone != null && String(data.phone).trim() !== '')
      this.phone = String(data.phone).trim()
    if (data.address != null && String(data.address).trim() !== '')
      this.address = String(data.address).trim()
    if (data.type !== undefined) this.type = String(data.type)
  }
}

export class UpdateCustomerDTO {
  code?: string
  taxId?: string
  name?: string
  email?: string
  phone?: string
  address?: string
  type?: string
  isActive?: boolean

  constructor(data: Record<string, unknown>) {
    if (data.code !== undefined) this.code = String(data.code)
    if (data.name !== undefined) this.name = String(data.name)
    if (data.taxId != null && String(data.taxId).trim() !== '')
      this.taxId = String(data.taxId).trim()
    if (data.email != null && String(data.email).trim() !== '')
      this.email = String(data.email).trim()
    if (data.phone != null && String(data.phone).trim() !== '')
      this.phone = String(data.phone).trim()
    if (data.address != null && String(data.address).trim() !== '')
      this.address = String(data.address).trim()
    if (data.type !== undefined) this.type = String(data.type)
    if (data.isActive !== undefined) this.isActive = Boolean(data.isActive)
  }
}

export class CustomerResponseDTO {
  id: string
  code: string
  taxId?: string | null
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  type: string
  isActive: boolean
  empresaId: string
  createdAt: Date
  updatedAt: Date

  constructor(data: ICustomer) {
    this.id = data.id
    this.code = data.code
    this.name = data.name
    this.type = data.type
    this.isActive = data.isActive
    this.empresaId = data.empresaId
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    if (data.taxId != null) this.taxId = data.taxId
    if (data.email != null) this.email = data.email
    if (data.phone != null) this.phone = data.phone
    if (data.address != null) this.address = data.address
  }
}
