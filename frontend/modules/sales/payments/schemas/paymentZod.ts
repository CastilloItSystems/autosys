import { z } from "zod";

export const paymentDetailSchema = z.object({
  method: z.enum(
    ["CASH", "TRANSFER", "CARD", "MOBILE_PAYMENT", "CHECK", "CREDIT", "MIXED"],
    { required_error: "El método es requerido" },
  ),
  amount: z
    .number({ required_error: "El monto es requerido" })
    .positive("Debe ser mayor a 0"),
  reference: z.string().max(100).optional(),
  currency: z.string().optional(),
});

export const createPaymentSchema = z.object({
  preInvoiceId: z.string().min(1, "La prefactura es requerida"),
  customerId: z.string().min(1, "El cliente es requerido"),
  method: z.enum(
    ["CASH", "TRANSFER", "CARD", "MOBILE_PAYMENT", "CHECK", "CREDIT", "MIXED"],
    { required_error: "El método de pago es requerido" },
  ),
  amount: z
    .number({ required_error: "El monto es requerido" })
    .positive("Debe ser mayor a 0"),
  currency: z.enum(["USD", "VES", "EUR"], {
    required_error: "La moneda es requerida",
  }),
  exchangeRate: z.number().positive().optional(),
  igtfApplies: z.boolean().optional(),
  details: z.array(paymentDetailSchema).optional(),
  reference: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

export const updatePaymentSchema = createPaymentSchema.partial();

export type CreatePaymentFormValues = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentFormValues = z.infer<typeof updatePaymentSchema>;
export type PaymentDetailFormValues = z.infer<typeof paymentDetailSchema>;
