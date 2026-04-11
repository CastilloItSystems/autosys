// backend/src/features/workshop/workshopTOT/workshopTOT.dto.ts
import type {
  ITOT,
  TOTStatus,
  TOTDocumentType,
  ICreateTOT,
  IUpdateTOT,
  IAddTOTDocument,
} from './workshopTOT.interface.js'

export class CreateTOTDTO implements ICreateTOT {
  serviceOrderId: string
  supplierId?: string
  providerName?: string
  partDescription: string
  partSerial?: string
  photoUrls?: string[]
  requestedWork: string
  technicalInstruction?: string
  estimatedReturnAt?: Date
  providerQuote?: number
  clientPrice?: number | null
  discountPct?: number
  taxType?: 'IVA' | 'EXEMPT' | 'REDUCED'
  taxRate?: number
  notes?: string

  constructor(data: any) {
    this.serviceOrderId = String(data.serviceOrderId)
    this.supplierId = data.supplierId || undefined
    this.providerName = data.providerName
      ? String(data.providerName).trim()
      : undefined
    this.partDescription = String(data.partDescription).trim()
    this.partSerial = data.partSerial
      ? String(data.partSerial).trim()
      : undefined
    this.photoUrls = Array.isArray(data.photoUrls) ? data.photoUrls : undefined
    this.requestedWork = String(data.requestedWork).trim()
    this.technicalInstruction = data.technicalInstruction
      ? String(data.technicalInstruction).trim()
      : undefined
    this.estimatedReturnAt = data.estimatedReturnAt
      ? new Date(data.estimatedReturnAt)
      : undefined
    this.providerQuote =
      data.providerQuote !== undefined && data.providerQuote !== null
        ? Number(data.providerQuote)
        : undefined
    this.clientPrice =
      data.clientPrice !== undefined && data.clientPrice !== null
        ? Number(data.clientPrice)
        : null
    this.discountPct =
      data.discountPct !== undefined ? Number(data.discountPct) : 0
    this.taxType = (['IVA', 'EXEMPT', 'REDUCED'] as const).includes(
      data.taxType
    )
      ? data.taxType
      : 'IVA'
    this.taxRate = data.taxRate !== undefined ? Number(data.taxRate) : 0.16
    this.notes = data.notes ? String(data.notes).trim() : undefined
  }
}

export class UpdateTOTDTO implements IUpdateTOT {
  supplierId?: string | null
  providerName?: string | null
  partDescription?: string
  partSerial?: string | null
  photoUrls?: string[] | null
  requestedWork?: string
  technicalInstruction?: string | null
  approvedById?: string | null
  departureRef?: string | null
  departedAt?: Date | null
  estimatedReturnAt?: Date | null
  returnedAt?: Date | null
  providerQuote?: number | null
  finalCost?: number | null
  providerInvoiceRef?: string | null
  clientPrice?: number | null
  discountPct?: number
  taxType?: 'IVA' | 'EXEMPT' | 'REDUCED'
  taxRate?: number
  notes?: string | null

  constructor(data: any) {
    if ('supplierId' in data) this.supplierId = data.supplierId || null
    if ('providerName' in data)
      this.providerName = data.providerName
        ? String(data.providerName).trim()
        : null
    if (data.partDescription !== undefined)
      this.partDescription = String(data.partDescription).trim()
    if ('partSerial' in data)
      this.partSerial = data.partSerial ? String(data.partSerial).trim() : null
    if ('photoUrls' in data)
      this.photoUrls = Array.isArray(data.photoUrls) ? data.photoUrls : null
    if (data.requestedWork !== undefined)
      this.requestedWork = String(data.requestedWork).trim()
    if ('technicalInstruction' in data)
      this.technicalInstruction = data.technicalInstruction
        ? String(data.technicalInstruction).trim()
        : null
    if ('approvedById' in data) this.approvedById = data.approvedById || null
    if ('departureRef' in data)
      this.departureRef = data.departureRef
        ? String(data.departureRef).trim()
        : null
    if ('departedAt' in data)
      this.departedAt = data.departedAt ? new Date(data.departedAt) : null
    if ('estimatedReturnAt' in data)
      this.estimatedReturnAt = data.estimatedReturnAt
        ? new Date(data.estimatedReturnAt)
        : null
    if ('returnedAt' in data)
      this.returnedAt = data.returnedAt ? new Date(data.returnedAt) : null
    if ('providerQuote' in data)
      this.providerQuote =
        data.providerQuote !== null ? Number(data.providerQuote) : null
    if ('finalCost' in data)
      this.finalCost = data.finalCost !== null ? Number(data.finalCost) : null
    if ('providerInvoiceRef' in data)
      this.providerInvoiceRef = data.providerInvoiceRef
        ? String(data.providerInvoiceRef).trim()
        : null
    if ('clientPrice' in data)
      this.clientPrice =
        data.clientPrice !== null ? Number(data.clientPrice) : null
    if ('discountPct' in data) this.discountPct = Number(data.discountPct)
    if (
      'taxType' in data &&
      (['IVA', 'EXEMPT', 'REDUCED'] as const).includes(data.taxType)
    )
      this.taxType = data.taxType
    if ('taxRate' in data) this.taxRate = Number(data.taxRate)
    if ('notes' in data)
      this.notes = data.notes ? String(data.notes).trim() : null
  }
}

export class AddTOTDocumentDTO implements IAddTOTDocument {
  type: TOTDocumentType
  url: string
  description?: string

  constructor(data: any) {
    this.type = data.type as TOTDocumentType
    this.url = String(data.url)
    this.description = data.description
      ? String(data.description).trim()
      : undefined
  }
}

export class TOTResponseDTO {
  id: string
  totNumber: string
  status: TOTStatus
  serviceOrderId: string
  serviceOrder: any | null
  supplierId: string | null
  supplier: any | null
  providerName: string | null
  partDescription: string
  partSerial: string | null
  photoUrls: string[] | null
  requestedWork: string
  technicalInstruction: string | null
  approvedById: string | null
  departureRef: string | null
  departedAt: Date | null
  estimatedReturnAt: Date | null
  returnedAt: Date | null
  providerQuote: number | null
  finalCost: number | null
  providerInvoiceRef: string | null
  notes: string | null
  documents: any[]
  empresaId: string
  createdBy: string
  createdAt: Date
  updatedAt: Date

  constructor(data: any) {
    this.id = data.id
    this.totNumber = data.totNumber
    this.status = data.status
    this.serviceOrderId = data.serviceOrderId
    this.serviceOrder = data.serviceOrder ?? null
    this.supplierId = data.supplierId ?? null
    this.supplier = data.supplier ?? null
    this.providerName = data.providerName ?? null
    this.partDescription = data.partDescription
    this.partSerial = data.partSerial ?? null
    this.photoUrls = data.photoUrls ?? null
    this.requestedWork = data.requestedWork
    this.technicalInstruction = data.technicalInstruction ?? null
    this.approvedById = data.approvedById ?? null
    this.departureRef = data.departureRef ?? null
    this.departedAt = data.departedAt ?? null
    this.estimatedReturnAt = data.estimatedReturnAt ?? null
    this.returnedAt = data.returnedAt ?? null
    this.providerQuote =
      data.providerQuote !== null && data.providerQuote !== undefined
        ? Number(data.providerQuote)
        : null
    this.finalCost =
      data.finalCost !== null && data.finalCost !== undefined
        ? Number(data.finalCost)
        : null
    this.providerInvoiceRef = data.providerInvoiceRef ?? null
    this.notes = data.notes ?? null
    this.documents = data.documents ?? []
    this.empresaId = data.empresaId
    this.createdBy = data.createdBy
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }
}
