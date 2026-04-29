import { z } from "zod";

export const createExpenseSchema = z.object({
  category: z.enum(
    [
      "UTILITIES",
      "RENT",
      "PAYROLL",
      "SERVICES",
      "MAINTENANCE",
      "SUPPLIES",
      "MARKETING",
      "TAXES",
      "BANK_FEES",
      "TRANSPORT",
      "OTHER",
    ],
    { required_error: "La categoría es requerida" },
  ),
  description: z.string().min(1, "La descripción es obligatoria").max(255),
  supplierId: z.string().optional(),
  bankAccountId: z.string().optional(),
  currency: z.enum(["USD", "VES", "EUR"], {
    required_error: "La moneda es requerida",
  }),
  exchangeRate: z.number().positive().optional(),
  amount: z
    .number({ required_error: "El monto es requerido" })
    .positive("El monto debe ser mayor a 0"),
  taxAmount: z.number().min(0).optional(),
  expenseDate: z.string().min(1, "La fecha es requerida"),
  notes: z.string().max(500).optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const createRecurringRuleSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(100),
  category: z.enum(
    [
      "UTILITIES",
      "RENT",
      "PAYROLL",
      "SERVICES",
      "MAINTENANCE",
      "SUPPLIES",
      "MARKETING",
      "TAXES",
      "BANK_FEES",
      "TRANSPORT",
      "OTHER",
    ],
    { required_error: "La categoría es requerida" },
  ),
  description: z.string().min(1, "La descripción es obligatoria").max(255),
  supplierId: z.string().optional(),
  amount: z
    .number({ required_error: "El monto es requerido" })
    .positive("El monto debe ser mayor a 0"),
  currency: z.enum(["USD", "VES", "EUR"], {
    required_error: "La moneda es requerida",
  }),
  frequency: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"], {
    required_error: "La frecuencia es requerida",
  }),
  dayOfMonth: z.number().min(1).max(28).optional(),
  startDate: z.string().min(1, "La fecha de inicio es requerida"),
  endDate: z.string().optional(),
});

export const updateRecurringRuleSchema = createRecurringRuleSchema.partial();

export type CreateExpenseFormValues = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseFormValues = z.infer<typeof updateExpenseSchema>;
export type CreateRecurringRuleFormValues = z.infer<
  typeof createRecurringRuleSchema
>;
export type UpdateRecurringRuleFormValues = z.infer<
  typeof updateRecurringRuleSchema
>;
