// backend/src/features/crm/customers/customers.dto.ts

import { ICustomer } from './customers.interface.js'

export class CreateCustomerDTO {
  code: string
  name: string
  taxId?: string
  email?: string
  phone?: string
  mobile?: string
  website?: string
  contactPerson?: string
  address?: string
  shippingAddress?: string
  billingAddress?: string
  type?: string
  isSpecialTaxpayer?: boolean
  priceList?: number
  creditLimit?: number
  creditDays?: number
  defaultDiscount?: number
  segment?: string
  preferredChannel?: string
  assignedSellerId?: string
  customerSince?: string
  referredById?: string
  notes?: string
  metadata?: any

  constructor(data: Record<string, unknown>) {
    this.code = String(data.code)
    this.name = String(data.name)
    if (data.taxId != null && String(data.taxId).trim() !== '')
      this.taxId = String(data.taxId).trim()
    if (data.email != null && String(data.email).trim() !== '')
      this.email = String(data.email).trim()
    if (data.phone != null && String(data.phone).trim() !== '')
      this.phone = String(data.phone).trim()
    if (data.mobile != null && String(data.mobile).trim() !== '')
      this.mobile = String(data.mobile).trim()
    if (data.website != null && String(data.website).trim() !== '')
      this.website = String(data.website).trim()
    if (data.contactPerson != null && String(data.contactPerson).trim() !== '')
      this.contactPerson = String(data.contactPerson).trim()
    if (data.address != null && String(data.address).trim() !== '')
      this.address = String(data.address).trim()
    if (data.shippingAddress != null && String(data.shippingAddress).trim() !== '')
      this.shippingAddress = String(data.shippingAddress).trim()
    if (data.billingAddress != null && String(data.billingAddress).trim() !== '')
      this.billingAddress = String(data.billingAddress).trim()
    if (data.type !== undefined) this.type = String(data.type)
    if (data.isSpecialTaxpayer !== undefined)
      this.isSpecialTaxpayer = Boolean(data.isSpecialTaxpayer)
    if (data.priceList !== undefined) this.priceList = Number(data.priceList)
    if (data.creditLimit !== undefined) this.creditLimit = Number(data.creditLimit)
    if (data.creditDays !== undefined) this.creditDays = Number(data.creditDays)
    if (data.defaultDiscount !== undefined)
      this.defaultDiscount = Number(data.defaultDiscount)
    if (data.segment !== undefined) this.segment = String(data.segment)
    if (data.preferredChannel !== undefined)
      this.preferredChannel = String(data.preferredChannel)
    if (data.assignedSellerId != null && String(data.assignedSellerId).trim() !== '')
      this.assignedSellerId = String(data.assignedSellerId).trim()
    if (data.customerSince != null && String(data.customerSince).trim() !== '')
      this.customerSince = String(data.customerSince).trim()
    if (data.referredById != null && String(data.referredById).trim() !== '')
      this.referredById = String(data.referredById).trim()
    if (data.notes != null && String(data.notes).trim() !== '')
      this.notes = String(data.notes).trim()
    if (data.metadata !== undefined) this.metadata = data.metadata
  }
}

export class UpdateCustomerDTO {
  code?: string
  name?: string
  taxId?: string
  email?: string
  phone?: string
  mobile?: string
  website?: string
  contactPerson?: string
  address?: string
  shippingAddress?: string
  billingAddress?: string
  type?: string
  isSpecialTaxpayer?: boolean
  priceList?: number
  creditLimit?: number
  creditDays?: number
  defaultDiscount?: number
  segment?: string
  preferredChannel?: string
  assignedSellerId?: string
  customerSince?: string
  referredById?: string
  notes?: string
  metadata?: any
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
    if (data.mobile != null && String(data.mobile).trim() !== '')
      this.mobile = String(data.mobile).trim()
    if (data.website != null && String(data.website).trim() !== '')
      this.website = String(data.website).trim()
    if (data.contactPerson != null && String(data.contactPerson).trim() !== '')
      this.contactPerson = String(data.contactPerson).trim()
    if (data.address != null && String(data.address).trim() !== '')
      this.address = String(data.address).trim()
    if (data.shippingAddress != null && String(data.shippingAddress).trim() !== '')
      this.shippingAddress = String(data.shippingAddress).trim()
    if (data.billingAddress != null && String(data.billingAddress).trim() !== '')
      this.billingAddress = String(data.billingAddress).trim()
    if (data.type !== undefined) this.type = String(data.type)
    if (data.isSpecialTaxpayer !== undefined)
      this.isSpecialTaxpayer = Boolean(data.isSpecialTaxpayer)
    if (data.priceList !== undefined) this.priceList = Number(data.priceList)
    if (data.creditLimit !== undefined) this.creditLimit = Number(data.creditLimit)
    if (data.creditDays !== undefined) this.creditDays = Number(data.creditDays)
    if (data.defaultDiscount !== undefined)
      this.defaultDiscount = Number(data.defaultDiscount)
    if (data.segment !== undefined) this.segment = String(data.segment)
    if (data.preferredChannel !== undefined)
      this.preferredChannel = String(data.preferredChannel)
    if (data.assignedSellerId !== undefined)
      this.assignedSellerId = data.assignedSellerId ? String(data.assignedSellerId) : undefined
    if (data.customerSince !== undefined)
      this.customerSince = data.customerSince ? String(data.customerSince) : undefined
    if (data.referredById !== undefined)
      this.referredById = data.referredById ? String(data.referredById) : undefined
    if (data.notes != null && String(data.notes).trim() !== '')
      this.notes = String(data.notes).trim()
    if (data.metadata !== undefined) this.metadata = data.metadata
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
  mobile?: string | null
  website?: string | null
  contactPerson?: string | null
  address?: string | null
  shippingAddress?: string | null
  billingAddress?: string | null
  type: string
  isSpecialTaxpayer: boolean
  priceList: number
  creditLimit: number
  creditDays: number
  defaultDiscount: number
  segment: string
  preferredChannel: string
  assignedSellerId?: string | null
  customerSince?: Date | null
  referredById?: string | null
  notes?: string | null
  metadata?: any | null
  isActive: boolean
  empresaId: string
  createdAt: Date
  updatedAt: Date

  constructor(data: ICustomer) {
    this.id = data.id
    this.code = data.code
    this.name = data.name
    this.type = data.type
    this.isSpecialTaxpayer = data.isSpecialTaxpayer
    this.priceList = data.priceList
    this.creditLimit = data.creditLimit
    this.creditDays = data.creditDays
    this.defaultDiscount = data.defaultDiscount
    this.segment = data.segment
    this.preferredChannel = data.preferredChannel
    this.isActive = data.isActive
    this.empresaId = data.empresaId
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    if (data.taxId != null) this.taxId = data.taxId
    if (data.email != null) this.email = data.email
    if (data.phone != null) this.phone = data.phone
    if (data.mobile != null) this.mobile = data.mobile
    if (data.website != null) this.website = data.website
    if (data.contactPerson != null) this.contactPerson = data.contactPerson
    if (data.address != null) this.address = data.address
    if (data.shippingAddress != null) this.shippingAddress = data.shippingAddress
    if (data.billingAddress != null) this.billingAddress = data.billingAddress
    if (data.assignedSellerId != null) this.assignedSellerId = data.assignedSellerId
    if (data.customerSince != null) this.customerSince = data.customerSince
    if (data.referredById != null) this.referredById = data.referredById
    if (data.notes != null) this.notes = data.notes
    if (data.metadata !== undefined) this.metadata = data.metadata
  }
}
