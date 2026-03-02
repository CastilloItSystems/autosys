import { z } from "zod";

export const cycleCountItemSchema = z.object({
  itemId: z.string().min(1, "Artículo es requerido"),
  expectedQuantity: z
    .number()
    .min(0, "Cantidad esperada no puede ser negativa"),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export const createCycleCountSchema = z.object({
  warehouseId: z.string().min(1, "Almacén es requerido"),
  items: z
    .array(cycleCountItemSchema)
    .min(1, "Al menos un artículo es requerido"),
  notes: z.string().optional(),
});

export const updateCycleCountSchema = z.object({
  warehouseId: z.string().min(1, "Almacén es requerido").optional(),
  items: z
    .array(cycleCountItemSchema)
    .min(1, "Al menos un artículo es requerido")
    .optional(),
  notes: z.string().optional(),
});

export const updateCountedQuantitySchema = z.object({
  countedQuantity: z.number().min(0, "Cantidad contada no puede ser negativa"),
});

export type CycleCountItemInput = z.infer<typeof cycleCountItemSchema>;
export type CreateCycleCountInput = z.infer<typeof createCycleCountSchema>;
export type UpdateCycleCountInput = z.infer<typeof updateCycleCountSchema>;
export type UpdateCountedQuantityInput = z.infer<
  typeof updateCountedQuantitySchema
>;
