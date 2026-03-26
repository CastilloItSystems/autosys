import { z } from "zod";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const purchaseOrderItemSchema = z.object({
  itemId: z
    .string()
    .min(1, "El artículo es requerido")
    .regex(uuidRegex, "Debe seleccionar un artículo válido de la lista"),
  itemName: z.string().optional().default(""),
  quantityOrdered: z.number().min(1, "La cantidad debe ser mayor a 0"),
  unitCost: z.number().min(0, "El costo unitario no puede ser negativo"),
  discountPercent: z
    .number()
    .min(0, "El descuento no puede ser negativo")
    .max(100, "El descuento no puede ser mayor a 100%")
    .default(0),
  taxType: z
    .enum(["IVA", "EXEMPT", "REDUCED"], {
      errorMap: () => ({ message: "Tipo de impuesto inválido" }),
    })
    .default("IVA"),
  totalLine: z.number().min(0).optional().default(0),
});

export const purchaseOrderSchema = z.object({
  supplierId: z
    .string()
    .min(1, "El proveedor es requerido")
    .regex(uuidRegex, "Proveedor inválido"),
  warehouseId: z
    .string()
    .min(1, "El almacén es requerido")
    .regex(uuidRegex, "Almacén inválido"),
  currency: z
    .enum(["USD", "EUR", "VES"], {
      errorMap: () => ({ message: "Moneda inválida" }),
    })
    .default("USD"),
  exchangeRate: z
    .number()
    .positive("La tasa de cambio debe ser positiva")
    .nullable()
    .optional(),
  paymentTerms: z.string().optional().nullable().default(null),
  creditDays: z
    .number()
    .min(0, "Los días de crédito no pueden ser negativos")
    .nullable()
    .optional(),
  deliveryTerms: z.string().optional().nullable().default(null),
  discountAmount: z
    .number()
    .min(0, "El monto de descuento no puede ser negativo")
    .default(0),
  igtfApplies: z.boolean().default(false),
  notes: z.string().optional().default(""),
  expectedDate: z.date().optional(),
  items: z
    .array(purchaseOrderItemSchema)
    .min(1, "Debe agregar al menos un ítem"),
});

export type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;
