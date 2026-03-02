import { date, object, string, union, z } from "zod";
import { SerialStatus } from "../../types/serialNumber.interface";

export const createSerialNumberSchema = object({
  serialNumber: string().min(1, "Número de serie es obligatorio"),
  sku: string().min(1, "SKU es obligatorio"),
  itemId: string().min(1, "ID del artículo es obligatorio"),
  warehouseId: string().optional(),
  batchId: string().optional(),
  purchaseOrderNumber: string().optional(),
  location: string().optional(),
  notes: string().optional(),
});

export const updateSerialNumberSchema = object({
  status: z
    .enum([
      SerialStatus.IN_STOCK,
      SerialStatus.SOLD,
      SerialStatus.DEFECTIVE,
      SerialStatus.WARRANTY,
      SerialStatus.LOANED,
    ])
    .optional(),
  warehouseId: string().optional(),
  location: string().optional(),
  notes: string().optional(),
});

export const serialNumberFiltersSchema = object({
  itemId: string().optional(),
  sku: string().optional(),
  status: z
    .enum([
      SerialStatus.IN_STOCK,
      SerialStatus.SOLD,
      SerialStatus.DEFECTIVE,
      SerialStatus.WARRANTY,
      SerialStatus.LOANED,
    ])
    .optional(),
  warehouseId: string().optional(),
  serialNumber: string().optional(),
});

export type CreateSerialNumberInput = z.infer<typeof createSerialNumberSchema>;
export type UpdateSerialNumberInput = z.infer<typeof updateSerialNumberSchema>;
export type SerialNumberFilters = z.infer<typeof serialNumberFiltersSchema>;
