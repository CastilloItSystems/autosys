// libs/zods/crm/customerVehicleZod.ts

import { z } from "zod";

export const createCustomerVehicleSchema = z.object({
  plate: z
    .string()
    .min(1, "La placa es requerida")
    .max(20, "Máximo 20 caracteres")
    .transform((v) => v.toUpperCase()),
  brandId: z.string().uuid("UUID inválido").optional().or(z.literal("")),
  modelId: z.string().uuid("UUID inválido").optional().or(z.literal("")),
  vin: z.string().max(50).optional().or(z.literal("")),
  year: z.coerce.number().int().min(1900).max(2100).optional().nullable(),
  color: z.string().max(50).optional().or(z.literal("")),
  fuelType: z
    .enum(["GASOLINE", "DIESEL", "ELECTRIC", "HYBRID", "GAS"])
    .optional()
    .nullable(),
  transmission: z.enum(["MANUAL", "AUTOMATIC", "CVT"]).optional().nullable(),
  mileage: z.coerce.number().int().min(0).optional().nullable(),
  purchasedHere: z.boolean().optional().default(false),
  notes: z.string().optional().or(z.literal("")),
});

export const updateCustomerVehicleSchema = createCustomerVehicleSchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  });

export type CreateCustomerVehicleInput = z.infer<typeof createCustomerVehicleSchema>;
export type UpdateCustomerVehicleInput = z.infer<typeof updateCustomerVehicleSchema>;
