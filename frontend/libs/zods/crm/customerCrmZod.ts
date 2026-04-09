// libs/zods/crm/customerCrmZod.ts

import { z } from "zod";

export const createCustomerCrmSchema = z.object({
  code: z.string().min(1, "El código es requerido").max(50, "Máximo 50 caracteres"),
  name: z.string().min(1, "El nombre es requerido").max(255, "Máximo 255 caracteres"),
  taxId: z.string().max(20).optional().or(z.literal("")),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  mobile: z.string().max(20).optional().or(z.literal("")),
  website: z.string().max(150).optional().or(z.literal("")),
  contactPerson: z.string().max(100).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  shippingAddress: z.string().max(500).optional().or(z.literal("")),
  billingAddress: z.string().max(500).optional().or(z.literal("")),
  type: z.enum(["INDIVIDUAL", "COMPANY"]).default("INDIVIDUAL"),
  isSpecialTaxpayer: z.boolean().optional().default(false),
  priceList: z.coerce.number().int().min(1).optional().default(1),
  creditLimit: z.coerce.number().min(0).optional().default(0),
  creditDays: z.coerce.number().int().min(0).optional().default(0),
  defaultDiscount: z.coerce.number().min(0).max(100).optional().default(0),
  // CRM fields
  segment: z
    .enum(["PROSPECT", "REGULAR", "VIP", "WHOLESALE", "INACTIVE"])
    .default("PROSPECT"),
  preferredChannel: z
    .enum(["REPUESTOS", "TALLER", "VEHICULOS", "ALL"])
    .default("ALL"),
  assignedSellerId: z.string().uuid("UUID inválido").optional().or(z.literal("")),
  customerSince: z.string().optional().or(z.literal("")),
  referredById: z.string().uuid("UUID inválido").optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  isActive: z.boolean().optional().default(true),
});

export type CreateCustomerCrmInput = z.infer<typeof createCustomerCrmSchema>;
export type UpdateCustomerCrmInput = z.infer<typeof createCustomerCrmSchema>;
