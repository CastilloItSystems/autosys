// libs/zods/sales/customerZod.tsx

import { z } from "zod";

export const createCustomerSchema = z.object({
  code: z
    .string()
    .min(1, "El código es requerido")
    .max(50, "Máximo 50 caracteres"),
  taxId: z.string().max(20).optional().or(z.literal("")),
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(255, "Máximo 255 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  mobile: z.string().max(20).optional().or(z.literal("")),
  website: z.string().max(150).optional().or(z.literal("")),
  contactPerson: z.string().max(100).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  shippingAddress: z.string().max(500).optional().or(z.literal("")),
  billingAddress: z.string().max(500).optional().or(z.literal("")),
  type: z.enum(["INDIVIDUAL", "COMPANY"]).optional().default("INDIVIDUAL"),
  isSpecialTaxpayer: z.boolean().optional().default(false),
  priceList: z.coerce.number().int().min(1).optional().default(1),
  creditLimit: z.coerce.number().min(0).optional().default(0),
  creditDays: z.coerce.number().min(0).optional().default(0),
  defaultDiscount: z.coerce.number().min(0).max(100).optional().default(0),
  notes: z.string().optional().or(z.literal("")),
  metadata: z.any().optional(),
  isActive: z.boolean().optional().default(true),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof createCustomerSchema>;
