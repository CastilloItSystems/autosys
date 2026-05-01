/**
 * Shared constants for workshop items — kept in separate file to avoid circular dependencies
 */

export interface WorkshopItemRowColWidths {
  handle: React.CSSProperties;
  type?: React.CSSProperties;
  description: React.CSSProperties;
  itemId?: React.CSSProperties;
  quantity: React.CSSProperties;
  unitPrice?: React.CSSProperties;
  discountPct?: React.CSSProperties;
  taxType?: React.CSSProperties;
  total?: React.CSSProperties;
  notes?: React.CSSProperties;
  isRequired?: React.CSSProperties;
  remove: React.CSSProperties;
}

// ── Default column widths ──────────────────────────────────────────────────────

export const WORKSHOP_ITEM_COL_WIDTHS: WorkshopItemRowColWidths = {
  handle: { width: "1.5rem", flexShrink: 0 },
  itemId: { width: "12rem", flexShrink: 0 }, // Código/SKU — PRIMERA COLUMNA, más ancho
  type: { width: "6rem", flexShrink: 0 }, // Badge tipo — más pequeño
  description: { flex: "1 1 0", minWidth: 0 },
  quantity: { width: "5rem", flexShrink: 0 },
  unitPrice: { width: "8rem", flexShrink: 0 },
  discountPct: { width: "5.5rem", flexShrink: 0 },
  taxType: { width: "8rem", flexShrink: 0 },
  total: { width: "8rem", flexShrink: 0 },
  remove: { width: "2rem", flexShrink: 0 },
};

export const WORKSHOP_SUGGESTED_ITEM_COL_WIDTHS: WorkshopItemRowColWidths = {
  handle: { width: "1.5rem", flexShrink: 0 },
  itemId: { width: "12rem", flexShrink: 0 }, // Código/SKU — PRIMERA COLUMNA
  description: { flex: "1 1 0", minWidth: 0 },
  quantity: { width: "6rem", flexShrink: 0 },
  notes: { width: "12rem", flexShrink: 0 },
  isRequired: { width: "5rem", flexShrink: 0 },
  remove: { width: "2rem", flexShrink: 0 },
};
