import { z } from "zod";

// ── Movement Type Schema (10 enum values) ───────────────────────────────

export const movementTypeSchema = z.enum([
  "PURCHASE",
  "SALE",
  "ADJUSTMENT_IN",
  "ADJUSTMENT_OUT",
  "TRANSFER",
  "SUPPLIER_RETURN",
  "WORKSHOP_RETURN",
  "RESERVATION_RELEASE",
  "LOAN_OUT",
  "LOAN_RETURN",
]);

// ── Create Movement Schema ──────────────────────────────────────────────

export const createMovementSchema = z
  .object({
    type: movementTypeSchema,
    itemId: z.string().min(1, "El artículo es obligatorio"),
    quantity: z.number().min(1, "La cantidad debe ser al menos 1"),
    unitCost: z
      .number()
      .min(0, "El costo unitario no puede ser negativo")
      .optional()
      .nullable(),
    warehouseFromId: z.string().optional().nullable(),
    warehouseToId: z.string().optional().nullable(),
    reference: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      // TRANSFER requires both warehouses
      if (data.type === "TRANSFER") {
        return data.warehouseFromId && data.warehouseToId;
      }
      // PURCHASE requires destination warehouse
      if (data.type === "PURCHASE") {
        return data.warehouseToId;
      }
      // SALE requires source warehouse
      if (data.type === "SALE") {
        return data.warehouseFromId;
      }
      // ADJUSTMENT_IN, ADJUSTMENT_OUT require destination warehouse
      if (data.type === "ADJUSTMENT_IN" || data.type === "ADJUSTMENT_OUT") {
        return data.warehouseToId;
      }
      // SUPPLIER_RETURN requires source warehouse
      if (data.type === "SUPPLIER_RETURN") {
        return data.warehouseFromId;
      }
      // WORKSHOP_RETURN requires destination warehouse
      if (data.type === "WORKSHOP_RETURN") {
        return data.warehouseToId;
      }
      // RESERVATION_RELEASE requires warehouse
      if (data.type === "RESERVATION_RELEASE") {
        return data.warehouseToId;
      }
      // LOAN_OUT requires source warehouse
      if (data.type === "LOAN_OUT") {
        return data.warehouseFromId;
      }
      // LOAN_RETURN requires destination warehouse
      if (data.type === "LOAN_RETURN") {
        return data.warehouseToId;
      }
      return true;
    },
    {
      message: "Debe especificar los almacenes según el tipo de movimiento",
      path: ["warehouseFromId", "warehouseToId"],
    },
  );

// ── Legacy Aliases (for backward compatibility) ──────────────────────────

export const movementSchema = createMovementSchema;
