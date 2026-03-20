// libs/zods/sales/orderZod.tsx

import { z } from "zod";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const orderItemSchema = z.object({
  itemId: z
    .string()
    .min(1, "El artículo es requerido")
    .regex(uuidRegex, "Debe seleccionar un artículo válido de la lista"),
  itemName: z.string().optional().default(""),
  quantity: z.number().min(1, "La cantidad debe ser mayor a 0"),
  unitPrice: z.number().min(0, "El precio debe ser mayor o igual a 0"),
  discountPercent: z.number().min(0).max(100).optional().default(0),
  taxType: z.enum(["IVA", "EXEMPT", "REDUCED"]).optional().default("IVA"),
  totalLine: z.number().optional(),
  notes: z.string().optional(),
});

export const createOrderSchema = z
  .object({
    customerId: z
      .string()
      .min(1, "El cliente es requerido")
      .regex(uuidRegex, "Cliente inválido"),
    warehouseId: z
      .string()
      .min(1, "El almacén es requerido")
      .regex(uuidRegex, "Almacén inválido"),
    currency: z.enum(["USD", "VES", "EUR"]).optional().default("USD"),
    exchangeRate: z.number().positive().optional().nullable(),
    exchangeRateSource: z.string().optional().nullable(),
    paymentTerms: z.string().optional(),
    creditDays: z.number().int().min(0).optional().nullable(),
    deliveryTerms: z.string().optional(),
    discountAmount: z.number().min(0).optional().default(0),
    igtfApplies: z.boolean().optional().default(false),
    taxRate: z.number().optional().default(16),
    igtfRate: z.number().optional().default(3),
    notes: z.string().optional(),
    items: z.array(orderItemSchema).min(1, "Debe agregar al menos un artículo"),
  })
  .superRefine((data, ctx) => {
    if (!data.items || data.items.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debe agregar al menos un artículo",
        path: ["items"],
      });
    }
  });

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
