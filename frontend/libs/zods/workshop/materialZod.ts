// libs/zods/workshop/materialZod.ts
import { z } from "zod";

export const materialItemSchema = z.object({
  description: z
    .string()
    .min(2, "La descripción debe tener al menos 2 caracteres")
    .max(500, "Máximo 500 caracteres"),
  quantity: z
    .number({ invalid_type_error: "Debe ser un número" })
    .positive("Debe ser mayor a 0"),
  unitPrice: z
    .number({ invalid_type_error: "Debe ser un número" })
    .min(0, "No puede ser negativo"),
  unitCost: z.number().min(0).nullable().optional(),
  discountPct: z.number().min(0).max(100).default(0),
  taxType: z.enum(["IVA", "EXEMPT", "REDUCED"]).default("IVA"),
  taxRate: z.number().min(0).max(1).default(0.16),
  itemId: z.string().min(1).nullable().optional(),
});

export const bulkCreateMaterialSchema = z.object({
  serviceOrderId: z.string().min(1, "La orden de servicio es requerida"),
  items: z.array(materialItemSchema).min(1, "Agrega al menos un material"),
});

// Keep for edit (single record)
export const createMaterialSchema = materialItemSchema.extend({
  serviceOrderId: z
    .string()
    .min(1, "El ID de la orden de trabajo es requerido"),
});

export const updateMaterialSchema = createMaterialSchema.partial().extend({
  quantityReserved: z.number().min(0).optional(),
  quantityDispatched: z.number().min(0).optional(),
  quantityConsumed: z.number().min(0).optional(),
  quantityReturned: z.number().min(0).optional(),
  status: z
    .enum([
      "REQUESTED",
      "RESERVED",
      "DISPATCHED",
      "CONSUMED",
      "RETURNED",
      "CANCELLED",
    ])
    .optional(),
});

export type MaterialItemForm = z.infer<typeof materialItemSchema>;
export type BulkCreateMaterialForm = z.infer<typeof bulkCreateMaterialSchema>;
export type CreateMaterialForm = z.infer<typeof createMaterialSchema>;
export type UpdateMaterialForm = z.infer<typeof updateMaterialSchema>;
