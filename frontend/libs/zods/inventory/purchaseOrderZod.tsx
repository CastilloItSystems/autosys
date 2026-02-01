import { array, boolean, date, number, object, string, union, z } from "zod";

export const purchaseOrderStatusSchema = z.enum([
  "pendiente",
  "parcial",
  "recibido",
  "cancelado",
]);

export const purchaseOrderLineSchema = object({
  item: string().min(1, "El item es obligatorio"),
  cantidad: number()
    .min(1, "La cantidad debe ser al menos 1")
    .refine((val) => val > 0, {
      message: "La cantidad debe ser mayor a 0",
    }),
  precioUnitario: number()
    .min(0, "El precio unitario no puede ser negativo")
    .refine((val) => val >= 0, {
      message: "El precio unitario debe ser mayor o igual a 0",
    }),
  recibido: number()
    .min(0, "La cantidad recibida no puede ser negativa")
    .optional(),
});

export const purchaseOrderSchema = object({
  id: string().optional(),
  numero: string()
    .min(1, "El número de orden es obligatorio")
    .max(50, "El número de orden no puede exceder los 50 caracteres"),
  proveedor: string().min(1, "El proveedor es obligatorio"),
  fecha: union([string(), date()]).optional(),
  items: array(purchaseOrderLineSchema)
    .min(1, "Debe incluir al menos un item en la orden")
    .refine((items) => items.length > 0, {
      message: "La orden debe tener al menos un item",
    }),
  estado: purchaseOrderStatusSchema.default("pendiente").optional(),
  creadoPor: string().optional(),
  eliminado: boolean().default(false).optional(),
  createdAt: string().optional(),
  updatedAt: string().optional(),
});
