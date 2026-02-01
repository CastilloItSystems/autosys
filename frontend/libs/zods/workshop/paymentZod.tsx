import { z } from "zod";

/**
 * Schema para detalles de pago según método
 */
export const paymentDetailsSchema = z.object({
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  cardLastFour: z.string().length(4).optional(),
  cardType: z.string().optional(),
  checkNumber: z.string().optional(),
  cryptoCurrency: z.string().optional(),
  walletAddress: z.string().optional(),
  otherDetails: z.string().optional(),
});

/**
 * Schema de validación para Payment
 */
export const paymentSchema = z.object({
  invoice: z.string().min(1, "Factura es requerida"),
  amount: z.number().min(0.01, "El monto debe ser mayor a 0"),
  paymentDate: z.union([z.date(), z.string()]).optional(),
  paymentMethod: z.enum(
    [
      "efectivo",
      "transferencia",
      "tarjeta_credito",
      "tarjeta_debito",
      "cheque",
      "cripto",
      "otro",
    ],
    {
      errorMap: () => ({ message: "Método de pago inválido" }),
    }
  ),
  reference: z.string().max(100).optional(),
  notes: z.string().max(300).optional(),
  status: z
    .enum(["pendiente", "confirmado", "rechazado", "reembolsado"])
    .default("confirmado")
    .optional(),
  paymentDetails: paymentDetailsSchema.optional(),
});

/**
 * Type inference para el formulario
 */
export type PaymentFormData = z.infer<typeof paymentSchema>;
export type PaymentDetailsFormData = z.infer<typeof paymentDetailsSchema>;
