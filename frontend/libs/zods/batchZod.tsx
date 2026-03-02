import { array, date, number, object, string, union, z } from "zod";
import { BatchStatus } from "../../types/batch.interface";

export const createBatchSchema = object({
  sku: string().min(1, "SKU es obligatorio"),
  itemId: string().min(1, "ID del artículo es obligatorio"),
  quantity: number().min(0, "La cantidad debe ser un número no negativo"),
  batchNumber: string().min(1, "Número de lote es obligatorio"),
  manufactureDate: union([string(), date()]),
  expiryDate: union([string(), date()]),
  warehouseId: string().optional(),
  notes: string().optional(),
});

export const updateBatchSchema = object({
  quantity: number()
    .min(0, "La cantidad debe ser un número no negativo")
    .optional(),
  quantityUsed: number()
    .min(0, "La cantidad usada debe ser un número no negativo")
    .optional(),
  warehouseId: string().optional(),
  notes: string().optional(),
  status: z
    .enum([
      BatchStatus.ACTIVE,
      BatchStatus.EXPIRED,
      BatchStatus.EXPIRING_SOON,
      BatchStatus.INACTIVE,
    ])
    .optional(),
});

export const batchFiltersSchema = object({
  itemId: string().optional(),
  sku: string().optional(),
  status: z
    .enum([
      BatchStatus.ACTIVE,
      BatchStatus.EXPIRED,
      BatchStatus.EXPIRING_SOON,
      BatchStatus.INACTIVE,
    ])
    .optional(),
  warehouseId: string().optional(),
  expiryDateFrom: union([string(), date()]).optional(),
  expiryDateTo: union([string(), date()]).optional(),
});

export type CreateBatchInput = z.infer<typeof createBatchSchema>;
export type UpdateBatchInput = z.infer<typeof updateBatchSchema>;
export type BatchFilters = z.infer<typeof batchFiltersSchema>;
