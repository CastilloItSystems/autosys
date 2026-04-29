import { z } from "zod";

export const createSupplierPaymentSchema = z.object({
  supplierId: z.string().min(1, "El proveedor es requerido"),
  supplierBillId: z.string().optional(),
  expenseId: z.string().optional(),
  bankAccountId: z.string().min(1, "La cuenta bancaria es requerida"),
  method: z.enum(
    ["CASH", "TRANSFER", "CARD", "MOBILE_PAYMENT", "CHECK", "CREDIT", "MIXED"],
    { required_error: "El método de pago es requerido" },
  ),
  amount: z
    .number({ required_error: "El monto es requerido" })
    .positive("El monto debe ser mayor a 0"),
  currency: z.enum(["USD", "VES", "EUR"], {
    required_error: "La moneda es requerida",
  }),
  exchangeRate: z.number().positive().optional(),
  igtfApplies: z.boolean().optional(),
  details: z.any().optional(),
  reference: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

export const paymentDetailSchema = z.object({
  method: z.enum([
    "CASH",
    "TRANSFER",
    "CARD",
    "MOBILE_PAYMENT",
    "CHECK",
    "CREDIT",
  ]),
  amount: z.number().positive("El monto debe ser mayor a 0"),
  currency: z.string().optional(),
  reference: z.string().optional(),
});

export type CreateSupplierPaymentFormValues = z.infer<
  typeof createSupplierPaymentSchema
>;
export type PaymentDetailFormValues = z.infer<typeof paymentDetailSchema>;
