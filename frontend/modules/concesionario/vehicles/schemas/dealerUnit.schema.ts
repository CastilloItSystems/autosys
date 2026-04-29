import { z } from "zod";

export const dealerUnitSchema = z.object({
  brandId: z
    .string({ required_error: "Marca requerida" })
    .min(1, "Marca requerida"),
  warehouseId: z
    .string({ required_error: "Almacén requerido" })
    .min(1, "Almacén requerido"),
  modelId: z.string().optional(),
  code: z.string().optional(),
  version: z.string().optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  vin: z.string().optional(),
  plate: z.string().optional(),
  condition: z.enum(["NEW", "USED", "DEMO", "CONSIGNMENT"]),
  status: z.enum([
    "AVAILABLE",
    "RESERVED",
    "IN_DOCUMENTATION",
    "INVOICED",
    "READY_FOR_DELIVERY",
    "DELIVERED",
    "BLOCKED",
  ]),
  listPrice: z.number().min(0).optional(),
  promoPrice: z.number().min(0).optional(),
  location: z.string().optional(),
  isPublished: z.boolean(),
  isActive: z.boolean(),
});

export type DealerUnitSchema = z.infer<typeof dealerUnitSchema>;
