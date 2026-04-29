import { z } from "zod";

export const dealerQuoteSchema = z.object({
  dealerUnitId: z
    .string({ required_error: "Unidad requerida" })
    .min(1, "Unidad requerida"),
  customerId: z
    .string({ required_error: "Cliente requerido" })
    .min(1, "Cliente requerido"),
  customerName: z.string().min(1, "Nombre de cliente requerido"),
  customerDocument: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z
    .string()
    .email("Email inválido")
    .optional()
    .or(z.literal("")),
  listPrice: z.number().min(0).optional(),
  discountPct: z.number().min(0).max(100).optional(),
  offeredPrice: z.number().min(0).optional(),
  taxPct: z.number().min(0).max(100).optional(),
  currency: z.enum(["USD", "VES", "EUR"]),
  exchangeRate: z.number().min(0).optional(),
  exchangeRateSource: z.enum(["BCV_AUTO", "MANUAL"]),
  validUntil: z.date().nullable().optional(),
  paymentTerms: z.string().optional(),
  financingRequired: z.boolean(),
  notes: z.string().optional(),
  status: z
    .string({ required_error: "Estatus requerido" })
    .min(1, "Estatus requerido"),
  isActive: z.boolean(),
});

export type DealerQuoteSchema = z.infer<typeof dealerQuoteSchema>;
