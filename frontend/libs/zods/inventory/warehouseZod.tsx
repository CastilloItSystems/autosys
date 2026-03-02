import { z } from "zod";

export const warehouseTypeEnum = z.enum(["PRINCIPAL", "SUCURSAL", "TRANSITO"], {
  errorMap: () => ({ message: "Selecciona un tipo válido" }),
});

export const createWarehouseSchema = z.object({
  code: z
    .string()
    .min(2, "El código debe tener al menos 2 caracteres")
    .max(50, "El código no puede exceder 50 caracteres")
    .toUpperCase(),
  name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(200, "El nombre no puede exceder 200 caracteres"),
  type: warehouseTypeEnum.default("PRINCIPAL"),
  address: z
    .string()
    .max(500, "La dirección no puede exceder 500 caracteres")
    .nullable()
    .optional(),
});

export const updateWarehouseSchema = z.object({
  code: z
    .string()
    .min(2, "El código debe tener al menos 2 caracteres")
    .max(50, "El código no puede exceder 50 caracteres")
    .toUpperCase()
    .optional(),
  name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(200, "El nombre no puede exceder 200 caracteres")
    .optional(),
  type: warehouseTypeEnum.optional(),
  address: z
    .string()
    .max(500, "La dirección no puede exceder 500 caracteres")
    .nullable()
    .optional(),
  isActive: z.boolean().optional(),
});

export type CreateWarehouse = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouse = z.infer<typeof updateWarehouseSchema>;
