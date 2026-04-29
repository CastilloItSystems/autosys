import { z } from "zod";

export const invoiceItemSchema = z.object({
  itemId: z.string().min(1, "El ítem es requerido"),
  itemName: z.string().optional(),
  quantity: z
    .number({ required_error: "La cantidad es requerida" })
    .positive("Debe ser mayor a 0"),
  unitPrice: z.number().min(0),
  discountPercent: z.number().min(0).max(100).optional(),
  taxType: z.string().optional(),
  taxRate: z.number().min(0).optional(),
});

export const createInvoiceSchema = z.object({
  preInvoiceId: z.string().min(1, "La prefactura es requerida"),
  paymentId: z.string().min(1, "El pago es requerido"),
  invoiceDate: z.string().min(1, "La fecha es requerida"),
  notes: z.string().max(500).optional(),
  items: z.array(invoiceItemSchema).optional(),
});

export const cancelInvoiceSchema = z.object({
  cancellationReason: z
    .string()
    .min(1, "El motivo de anulación es requerido")
    .max(500),
});

export type CreateInvoiceFormValues = z.infer<typeof createInvoiceSchema>;
export type CancelInvoiceFormValues = z.infer<typeof cancelInvoiceSchema>;
export type InvoiceItemFormValues = z.infer<typeof invoiceItemSchema>;
