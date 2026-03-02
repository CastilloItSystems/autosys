import { z } from "zod";

export const purchaseOrderItemSchema = z.object({
  itemId: z.string().min(1, "El artículo es obligatorio"),
  quantityOrdered: z
    .number()
    .int("La cantidad debe ser un número entero")
    .min(1, "La cantidad debe ser al menos 1"),
  unitCost: z.number().min(0, "El costo unitario no puede ser negativo"),
});

export const purchaseOrderSchema = z.object({
  supplierId: z.string().min(1, "El proveedor es obligatorio"),
  warehouseId: z.string().min(1, "El almacén es obligatorio"),
  notes: z.string().max(2000).optional().nullable(),
  expectedDate: z.union([z.string(), z.date()]).optional().nullable(),
  items: z
    .array(purchaseOrderItemSchema)
    .min(1, "Debe incluir al menos un artículo en la orden"),
});

export type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;
