// backend/src/features/workshop/serviceOrderAdditionals/serviceOrderAdditionals.interface.ts

export interface IServiceOrderAdditionalFilters {
  status?: string
  serviceOrderId?: string
  search?: string
  page?: number
  limit?: number
}

export type AdditionalStatus =
  | 'PROPOSED'
  | 'QUOTED'
  | 'APPROVED'
  | 'EXECUTED'
  | 'REJECTED'

export interface ICreateServiceOrderAdditional {
  description: string
  estimatedPrice: number
  status?: AdditionalStatus
  serviceOrderId: string
}

export interface IUpdateServiceOrderAdditional extends Partial<ICreateServiceOrderAdditional> {}

export interface IServiceOrderAdditionalWithRelations extends ICreateServiceOrderAdditional {
  id: string
  serviceOrder?: any
  createdAt: Date
  updatedAt: Date
}
