import { z } from "zod";

export const adjustmentItemSchema = z.object({
  itemId: z.string().min(1, "Artículo es requerido"),
  quantityChange: z.number().min(-999999, "Cambio mínimo inválido"),
  unitCost: z.number().optional(),
  notes: z.string().optional(),
});

export const createAdjustmentSchema = z.object({
  warehouseId: z.string().min(1, "Almacén es requerido"),
  reason: z
    .string()
    .min(1, "Motivo es requerido")
    .min(3, "Motivo debe tener al menos 3 caracteres"),
  items: z
    .array(adjustmentItemSchema)
    .min(1, "Al menos un artículo es requerido"),
  notes: z.string().optional(),
});

export const updateAdjustmentSchema = z.object({
  warehouseId: z.string().min(1, "Almacén es requerido").optional(),
  reason: z
    .string()
    .min(1, "Motivo es requerido")
    .min(3, "Motivo debe tener al menos 3 caracteres")
    .optional(),
  items: z
    .array(adjustmentItemSchema)
    .min(1, "Al menos un artículo es requerido")
    .optional(),
  notes: z.string().optional(),
});

export type AdjustmentItemInput = z.infer<typeof adjustmentItemSchema>;
export type CreateAdjustmentInput = z.infer<typeof createAdjustmentSchema>;
export type UpdateAdjustmentInput = z.infer<typeof updateAdjustmentSchema>;
