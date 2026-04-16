export type DealerUnitCondition = "NEW" | "USED" | "DEMO" | "CONSIGNMENT";
export type DealerUnitStatus =
  | "AVAILABLE"
  | "RESERVED"
  | "IN_DOCUMENTATION"
  | "INVOICED"
  | "READY_FOR_DELIVERY"
  | "DELIVERED"
  | "BLOCKED";

export interface DealerUnitRef {
  id: string;
  code?: string | null;
  name: string;
  year?: number | null;
}

export interface DealerBrandRef {
  id: string;
  code: string;
  name: string;
  type: string;
}

export interface DealerUnit {
  id: string;
  empresaId: string;
  brandId: string;
  modelId?: string | null;
  code?: string | null;
  version?: string | null;
  year?: number | null;
  vin?: string | null;
  plate?: string | null;
  condition: DealerUnitCondition;
  status: DealerUnitStatus;
  listPrice?: string | number | null;
  promoPrice?: string | number | null;
  location?: string | null;
  isPublished: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  brand: DealerBrandRef;
  model?: DealerUnitRef | null;
}

