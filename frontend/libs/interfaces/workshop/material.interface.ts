// libs/interfaces/workshop/material.interface.ts

export type MaterialStatus = 'REQUESTED' | 'RESERVED' | 'DISPATCHED' | 'CONSUMED' | 'RETURNED' | 'CANCELLED';

export interface ServiceOrderMaterial {
  id: string;
  description: string;
  quantityRequested: number;
  quantityReserved: number;
  quantityDispatched: number;
  quantityConsumed: number;
  quantityReturned: number;
  unitPrice: number;
  unitCost?: number | null;
  status: MaterialStatus;
  serviceOrderId: string;
  itemId?: string | null;
  empresaId: string;
  createdBy: string;
  serviceOrder?: { id: string; folio: string } | null;
  item?: { id: string; name: string; code: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: MaterialStatus;
  serviceOrderId?: string;
}

export interface CreateMaterialInput {
  description: string;
  quantityRequested: number;
  unitPrice: number;
  unitCost?: number;
  serviceOrderId: string;
  itemId?: string;
}

export interface UpdateMaterialInput extends Partial<CreateMaterialInput> {
  quantityReserved?: number;
  quantityDispatched?: number;
  quantityConsumed?: number;
  quantityReturned?: number;
  status?: MaterialStatus;
}
