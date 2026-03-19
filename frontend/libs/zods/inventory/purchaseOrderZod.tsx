import { z } from "zod";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const purchaseOrderItemSchema = z.object({
  itemId: z
    .string()
    .min(1, "El artículo es obligatorio")
    .regex(uuidRegex, "Debe seleccionar un artículo válido de la lista"),
  quantityOrdered: z
    .number()
    .int("La cantidad debe ser un número entero")
    .min(1, "La cantidad debe ser al menos 1"),
  unitCost: z.number().min(0, "El costo unitario no puede ser negativo"),
  discountPercent: z.number().min(0).max(100).optional().default(0),
  taxType: z.enum(["IVA", "EXEMPT", "REDUCED"]).optional().default("IVA"),
  totalLine: z.number().optional(),
});

export const purchaseOrderSchema = z.object({
  supplierId: z
    .string()
    .min(1, "El proveedor es obligatorio")
    .regex(uuidRegex, "Proveedor inválido"),
  warehouseId: z
    .string()
    .min(1, "El almacén es obligatorio")
    .regex(uuidRegex, "Almacén inválido"),
  currency: z.enum(["USD", "VES", "EUR"]).optional().default("USD"),
  exchangeRate: z
    .number()
    .positive("La tasa de cambio debe ser positiva")
    .optional()
    .nullable(),
  paymentTerms: z.string().max(255).optional().nullable(),
  creditDays: z.number().int().min(0).optional().nullable(),
  deliveryTerms: z.string().max(255).optional().nullable(),
  discountAmount: z
    .number()
    .min(0, "El descuento no puede ser negativo")
    .optional()
    .default(0),
  igtfApplies: z.boolean().optional().default(false),
  notes: z.string().max(2000).optional().nullable(),
  expectedDate: z.union([z.string(), z.date()]).optional().nullable(),
  items: z
    .array(purchaseOrderItemSchema)
    .min(1, "Debe incluir al menos un artículo en la orden"),
});

export type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;
