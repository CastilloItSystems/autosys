// libs/zods/sales/customerZod.tsx

import { z } from "zod";

export const createCustomerSchema = z.object({
  code: z
    .string()
    .min(1, "El código es requerido")
    .max(50, "Máximo 50 caracteres"),
  taxId: z.string().max(20).optional(),
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(255, "Máximo 255 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  type: z.enum(["INDIVIDUAL", "COMPANY"]).optional().default("INDIVIDUAL"),
  isActive: z.boolean().optional().default(true),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
