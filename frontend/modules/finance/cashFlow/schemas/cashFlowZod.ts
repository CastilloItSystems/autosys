import { z } from "zod";

export const createTransferSchema = z
  .object({
    fromAccountId: z.string().min(1, "La cuenta de origen es requerida"),
    toAccountId: z.string().min(1, "La cuenta de destino es requerida"),
    amount: z
      .number({ required_error: "El monto es requerido" })
      .positive("El monto debe ser mayor a 0"),
    currency: z.string().optional(),
    exchangeRate: z.number().positive().optional(),
    description: z.string().max(500).optional(),
  })
  .refine((d) => d.fromAccountId !== d.toAccountId, {
    message: "La cuenta de origen y destino deben ser distintas",
    path: ["toAccountId"],
  });

export const createAdjustmentSchema = z.object({
  bankAccountId: z.string().min(1, "La cuenta es requerida"),
  amount: z
    .number({ required_error: "El monto es requerido" })
    .positive("El monto debe ser mayor a 0"),
  description: z.string().min(1, "La descripción es requerida").max(500),
  exchangeRate: z.number().positive().optional(),
});

export type CreateTransferFormValues = z.infer<typeof createTransferSchema>;
export type CreateAdjustmentFormValues = z.infer<typeof createAdjustmentSchema>;
