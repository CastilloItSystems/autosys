import { z } from "zod";

export const dealerReservationSchema = z.object({
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
  offeredPrice: z.number().min(0).optional(),
  depositAmount: z.number().min(0).optional(),
  currency: z.enum(["USD", "VES", "EUR"]),
  exchangeRate: z.number().min(0).optional(),
  exchangeRateSource: z.enum(["BCV_AUTO", "MANUAL"]),
  expiresAt: z.date().nullable().optional(),
  notes: z.string().optional(),
  sourceChannel: z.string().optional(),
  status: z
    .string({ required_error: "Estatus requerido" })
    .min(1, "Estatus requerido"),
  isActive: z.boolean(),
});

export type DealerReservationSchema = z.infer<typeof dealerReservationSchema>;
