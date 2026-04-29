import { z } from "zod";

export const dealerFinancingSchema = z.object({
  dealerUnitId: z
    .string({ required_error: "Unidad requerida" })
    .min(1, "Unidad requerida"),
  customerId: z
    .string({ required_error: "Cliente requerido" })
    .min(1, "Cliente requerido"),
  customerName: z.string().min(1, "Nombre de cliente requerido"),
  bankName: z.string().optional(),
  currency: z.enum(["USD", "VES", "EUR"]),
  exchangeRate: z.number().min(0).optional(),
  exchangeRateSource: z.enum(["BCV_AUTO", "MANUAL"]),
  requestedAmount: z.number().min(0).optional(),
  approvedAmount: z.number().min(0).optional(),
  termMonths: z.number().int().min(1).optional(),
  status: z
    .string({ required_error: "Estatus requerido" })
    .min(1, "Estatus requerido"),
});

export type DealerFinancingSchema = z.infer<typeof dealerFinancingSchema>;
