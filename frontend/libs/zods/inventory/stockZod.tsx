import { number, object, string, z } from "zod";

/** Schema para crear un registro de stock */
export const createStockSchema = object({
  itemId: string().min(1, "El artículo es obligatorio"),
  warehouseId: string().min(1, "El almacén es obligatorio"),
  quantityReal: number()
    .int("Debe ser un número entero")
    .min(0, "La cantidad no puede ser negativa")
    .default(0)
    .optional(),
  quantityReserved: number()
    .int("Debe ser un número entero")
    .min(0, "La cantidad reservada no puede ser negativa")
    .default(0)
    .optional(),
  location: string()
    .max(20, "Ubicación máxima 20 caracteres")
    .optional()
    .nullable(),
  averageCost: number()
    .min(0, "El costo promedio no puede ser negativo")
    .default(0)
    .optional(),
});

/** Schema para actualizar un registro de stock */
export const updateStockSchema = object({
  quantityReal: number()
    .int("Debe ser un número entero")
    .min(0, "La cantidad no puede ser negativa")
    .optional(),
  quantityReserved: number()
    .int("Debe ser un número entero")
    .min(0, "La cantidad reservada no puede ser negativa")
    .optional(),
  location: string()
    .max(20, "Ubicación máxima 20 caracteres")
    .optional()
    .nullable(),
  averageCost: number()
    .min(0, "El costo promedio no puede ser negativo")
    .optional(),
});

/** Schema para ajustar stock */
export const adjustStockSchema = object({
  itemId: string().min(1, "El artículo es obligatorio"),
  warehouseId: string().min(1, "El almacén es obligatorio"),
  quantityChange: number()
    .int("Debe ser un número entero")
    .refine((v) => v !== 0, "La cantidad de ajuste no puede ser 0"),
  reason: string()
    .min(3, "La razón debe tener al menos 3 caracteres")
    .max(500, "La razón no puede exceder 500 caracteres"),
});

/** Alias legacy para compatibilidad */
export const stockSchema = createStockSchema;

export type CreateStock = z.infer<typeof createStockSchema>;
export type UpdateStock = z.infer<typeof updateStockSchema>;
export type AdjustStock = z.infer<typeof adjustStockSchema>;
