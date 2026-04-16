// backend/src/features/workshop/serviceOrderMaterials/serviceOrderMaterials.interface.ts

export interface IServiceOrderMaterialFilters {
  status?: string
  serviceOrderId?: string
  search?: string
  page?: number
  limit?: number
}

export type MaterialStatus =
  | 'REQUESTED'
  | 'RESERVED'
  | 'DISPATCHED'
  | 'CONSUMED'
  | 'RETURNED'
  | 'CANCELLED'

export interface ICreateServiceOrderMaterial {
  description: string
  quantityRequested: number
  quantityReserved?: number
  quantityDispatched?: number
  quantityConsumed?: number
  quantityReturned?: number
  unitPrice: number
  unitCost?: number
  discountPct?: number
  taxType?: 'IVA' | 'EXEMPT' | 'REDUCED'
  taxRate?: number
  status?: MaterialStatus
  clientApproved?: boolean | null
  clientApprovalAt?: Date | null
  clientApprovedBy?: string | null
  clientApprovalNotes?: string | null
  warehouseId?: string | null
  serviceOrderId: string
  itemId?: string
}

export interface IUpdateServiceOrderMaterial extends Partial<ICreateServiceOrderMaterial> {}

export interface IServiceOrderMaterialWithRelations extends ICreateServiceOrderMaterial {
  id: string
  empresaId: string
  createdBy: string
  serviceOrder?: any
  item?: any
  warehouse?: any
  dispatchExitNote?: {
    id: string
    exitNoteNumber: string
    status: string
  } | null
  createdAt: Date
  updatedAt: Date
}
