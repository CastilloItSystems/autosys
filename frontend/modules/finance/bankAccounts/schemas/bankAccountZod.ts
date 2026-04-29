import { z } from "zod";

export const createBankAccountSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(100),
  type: z.enum(["CHECKING", "SAVINGS", "CASH", "CRYPTO"], {
    required_error: "El tipo de cuenta es requerido",
  }),
  bankName: z.string().max(100).optional(),
  accountNumber: z.string().max(50).optional(),
  currency: z.enum(["USD", "VES", "EUR"], {
    required_error: "La moneda es requerida",
  }),
  initialBalance: z.number().min(0).optional(),
  notes: z.string().max(500).optional(),
});

export const updateBankAccountSchema = createBankAccountSchema.partial();

export type CreateBankAccountFormValues = z.infer<
  typeof createBankAccountSchema
>;
export type UpdateBankAccountFormValues = z.infer<
  typeof updateBankAccountSchema
>;
