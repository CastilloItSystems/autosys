// libs/interfaces/workshop/material.interface.ts
import type { TaxType } from "../inventory/purchaseOrder.interface";

export type MaterialStatus =
  | "REQUESTED"
  | "RESERVED"
  | "DISPATCHED"
  | "CONSUMED"
  | "RETURNED"
  | "CANCELLED";

export interface ServiceOrderMaterial {
  id: string;
  description: string;
  quantityRequested: number;
  quantityReserved: number;
  quantityDispatched: number;
  quantityConsumed: number;
  quantityReturned: number;
  quantity: number;
  unitPrice: number;
  unitCost?: number | null;
  discountPct: number;
  taxType: TaxType;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: MaterialStatus;
  clientApproved?: boolean | null;
  clientApprovalAt?: string | null;
  clientApprovedBy?: string | null;
  clientApprovalNotes?: string | null;
  warehouseId?: string | null;
  serviceOrderId: string;
  itemId?: string | null;
  empresaId: string;
  createdBy: string;
  serviceOrder?: { id: string; folio: string } | null;
  item?: { id: string; name: string; code: string } | null;
  warehouse?: { id: string; code: string; name: string } | null;
  dispatchExitNote?: {
    id: string;
    exitNoteNumber: string;
    status: string;
  } | null;
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
  discountPct?: number;
  taxType?: "IVA" | "EXEMPT" | "REDUCED";
  taxRate?: number;
  warehouseId?: string;
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
