// ── Movement Type Enum ──────────────────────────────────────────────────

export type MovementType =
  | "PURCHASE"
  | "SALE"
  | "ADJUSTMENT_IN"
  | "ADJUSTMENT_OUT"
  | "TRANSFER"
  | "SUPPLIER_RETURN"
  | "WORKSHOP_RETURN"
  | "RESERVATION_RELEASE"
  | "LOAN_OUT"
  | "LOAN_RETURN";

// ── Item Summary Interface ───────────────────────────────────────────────

export interface MovementItemSummary {
  id: string;
  sku: string;
  name: string;
  costPrice?: number;
}

// ── Warehouse Summary Interface ──────────────────────────────────────────

export interface MovementWarehouseSummary {
  id: string;
  code: string;
  name: string;
  type?: "PRINCIPAL" | "SUCURSAL" | "TRANSITO";
}

// ── Main Movement Interface ──────────────────────────────────────────────

export interface Movement {
  id: string;
  movementNumber: string;
  type: MovementType;
  itemId: string;
  quantity: number;
  unitCost?: number | null;
  totalCost?: number | null;
  reference?: string | null;
  notes?: string | null;
  warehouseFromId?: string | null;
  warehouseToId?: string | null;
  batchId?: string | null;
  purchaseOrderId?: string | null;
  workOrderId?: string | null;
  reservationId?: string | null;
  exitNoteId?: string | null;
  invoiceId?: string | null;
  exitType?: "MANUAL" | "SYSTEM" | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  movementDate: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  // Relations (optional, populated when includeRelations=true)
  item?: MovementItemSummary;
  warehouseFrom?: MovementWarehouseSummary;
  warehouseTo?: MovementWarehouseSummary;
}
