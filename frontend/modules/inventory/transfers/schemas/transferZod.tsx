import { z } from "zod";

export const transferItemSchema = z.object({
  itemId: z.string().min(1, "Artículo es requerido"),
  quantity: z.number().min(1, "Cantidad debe ser mayor a 0"),
  unitCost: z.number().optional(),
  notes: z.string().optional(),
});

export const createTransferSchema = z
  .object({
    fromWarehouseId: z.string().min(1, "Almacén origen es requerido"),
    toWarehouseId: z.string().min(1, "Almacén destino es requerido"),
    items: z
      .array(transferItemSchema)
      .min(1, "Al menos un artículo es requerido"),
    notes: z.string().optional(),
  })
  .refine((data) => data.fromWarehouseId !== data.toWarehouseId, {
    message: "El almacén origen y destino deben ser diferentes",
    path: ["toWarehouseId"],
  });

export const updateTransferSchema = z.object({
  notes: z.string().optional(),
});

export const rejectTransferSchema = z.object({
  reason: z
    .string()
    .min(1, "La razón del rechazo es requerida")
    .max(500, "Máximo 500 caracteres"),
});

export type TransferItemInput = z.infer<typeof transferItemSchema>;
export type CreateTransferInput = z.infer<typeof createTransferSchema>;
export type UpdateTransferInput = z.infer<typeof updateTransferSchema>;
export type RejectTransferInput = z.infer<typeof rejectTransferSchema>;
