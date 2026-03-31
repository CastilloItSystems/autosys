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
  status?: MaterialStatus
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
  createdAt: Date
  updatedAt: Date
}
