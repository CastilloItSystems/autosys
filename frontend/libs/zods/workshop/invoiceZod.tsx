import { z } from "zod";

// Invoice validation schema
export const invoiceSchema = z.object({
  workOrder: z.string().min(1, "Debe seleccionar una orden de trabajo"),
  issueDate: z.date(),
  dueDate: z.date(),
  status: z
    .enum([
      "borrador",
      "emitida",
      "pagada_parcial",
      "pagada_total",
      "vencida",
      "cancelada",
    ])
    .default("borrador"),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;

// Invoice Item validation schema
export const invoiceItemSchema = z.object({
  description: z.string().min(1, "La descripción es requerida"),
  quantity: z.number().min(1, "La cantidad debe ser al menos 1"),
  unitPrice: z.number().min(0, "El precio debe ser mayor o igual a 0"),
  service: z.string().optional(),
  repuesto: z.string().optional(),
});

export type InvoiceItemFormData = z.infer<typeof invoiceItemSchema>;
