import { z } from "zod";

const bankAccountBaseSchema = z.object({
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

const validateBankDetails = (
  data: Partial<z.infer<typeof bankAccountBaseSchema>>,
  ctx: z.RefinementCtx
) => {
  const isBankAccount = data.type === "CHECKING" || data.type === "SAVINGS";
  if (!isBankAccount) return;

  if (!data.bankName?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["bankName"],
      message: "El banco es obligatorio",
    });
  }

  if (!data.accountNumber?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["accountNumber"],
      message: "El número de cuenta es obligatorio",
    });
    return;
  }

  if (!/^\d{20}$/.test(data.accountNumber)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["accountNumber"],
      message: "El número de cuenta debe tener 20 dígitos",
    });
  }
};

export const createBankAccountSchema =
  bankAccountBaseSchema.superRefine(validateBankDetails);

export const updateBankAccountSchema = bankAccountBaseSchema
  .partial()
  .superRefine(validateBankDetails);

export type CreateBankAccountFormValues = z.infer<
  typeof createBankAccountSchema
>;
export type UpdateBankAccountFormValues = z.infer<
  typeof updateBankAccountSchema
>;
