import { z } from "zod";

export const preInvoiceItemSchema = z.object({
  itemId: z.string().nullable().optional(),
  itemName: z.string().nullable().optional(),
  quantity: z
    .number({ required_error: "La cantidad es requerida" })
    .positive("Debe ser mayor a 0"),
  unitPrice: z.number().min(0),
  discountPercent: z.number().min(0).max(100).optional(),
  taxType: z.string().optional(),
  taxRate: z.number().min(0).optional(),
  batchId: z.string().nullable().optional(),
  serialNumberId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const createPreInvoiceSchema = z.object({
  orderId: z.string().nullable().optional(),
  serviceOrderId: z.string().nullable().optional(),
  customerId: z.string().min(1, "El cliente es requerido"),
  warehouseId: z.string().nullable().optional(),
  currency: z.enum(["USD", "VES", "EUR"], {
    required_error: "La moneda es requerida",
  }),
  exchangeRate: z.number().positive().optional(),
  discountAmount: z.number().min(0).optional(),
  notes: z.string().max(500).optional(),
  items: z.array(preInvoiceItemSchema).min(1, "Debe incluir al menos un ítem"),
});

export const updatePreInvoiceSchema = createPreInvoiceSchema.partial();

export const preparePreInvoiceSchema = z.object({
  items: z.array(preInvoiceItemSchema).min(1, "Debe incluir al menos un ítem"),
});

export type CreatePreInvoiceFormValues = z.infer<typeof createPreInvoiceSchema>;
export type UpdatePreInvoiceFormValues = z.infer<typeof updatePreInvoiceSchema>;
export type PreparePreInvoiceFormValues = z.infer<
  typeof preparePreInvoiceSchema
>;
export type PreInvoiceItemFormValues = z.infer<typeof preInvoiceItemSchema>;
