import { z } from "zod";

export const reconciliationItemSchema = z.object({
  itemId: z.string().min(1, "Artículo es requerido"),
  systemQuantity: z
    .number()
    .min(0, "Cantidad del sistema no puede ser negativa"),
  expectedQuantity: z
    .number()
    .min(0, "Cantidad esperada no puede ser negativa"),
  notes: z.string().optional(),
});

export const createReconciliationSchema = z.object({
  warehouseId: z.string().min(1, "Almacén es requerido"),
  source: z
    .enum([
      "CYCLE_COUNT",
      "PHYSICAL_INVENTORY",
      "SYSTEM_ERROR",
      "ADJUSTMENT",
      "OTHER",
    ])
    .optional(),
  items: z
    .array(reconciliationItemSchema)
    .min(1, "Al menos un artículo es requerido"),
  notes: z.string().optional(),
});

export const updateReconciliationSchema = z.object({
  warehouseId: z.string().min(1, "Almacén es requerido").optional(),
  source: z
    .enum([
      "CYCLE_COUNT",
      "PHYSICAL_INVENTORY",
      "SYSTEM_ERROR",
      "ADJUSTMENT",
      "OTHER",
    ])
    .optional(),
  items: z
    .array(reconciliationItemSchema)
    .min(1, "Al menos un artículo es requerido")
    .optional(),
  notes: z.string().optional(),
});

export type ReconciliationItemInput = z.infer<typeof reconciliationItemSchema>;
export type CreateReconciliationInput = z.infer<
  typeof createReconciliationSchema
>;
export type UpdateReconciliationInput = z.infer<
  typeof updateReconciliationSchema
>;
