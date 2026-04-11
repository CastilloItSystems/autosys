// libs/interfaces/workshop/additional.interface.ts
import type { TaxType } from "../inventory/purchaseOrder.interface";

export type AdditionalStatus =
  | "PROPOSED"
  | "QUOTED"
  | "APPROVED"
  | "EXECUTED"
  | "REJECTED";
export type AdditionalItemType = "LABOR" | "PART" | "OTHER";

export interface ServiceOrderAdditionalItem {
  id: string;
  additionalId: string;
  type: AdditionalItemType;
  description: string;
  quantity: number;
  unitPrice: number;
  unitCost?: number;
  discountPct: number;
  taxType: TaxType;
  taxRate: number;
  taxAmount: number;
  total: number;
  clientApproved?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceOrderAdditional {
  id: string;
  description: string;
  estimatedPrice: number;
  status: AdditionalStatus;
  serviceOrderId: string;
  serviceOrder?: { id: string; folio: string } | null;
  items?: ServiceOrderAdditionalItem[];
  empresaId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdditionalFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: AdditionalStatus;
  serviceOrderId?: string;
}

export interface CreateAdditionalInput {
  description: string;
  estimatedPrice: number;
  serviceOrderId: string;
}

export interface UpdateAdditionalInput extends Partial<CreateAdditionalInput> {
  status?: AdditionalStatus;
}

export interface CreateAdditionalItemInput {
  type: AdditionalItemType;
  description: string;
  quantity: number;
  unitPrice: number;
  unitCost?: number;
  discountPct?: number;
  taxType?: "IVA" | "EXEMPT" | "REDUCED";
  taxRate?: number;
  clientApproved?: boolean;
}
