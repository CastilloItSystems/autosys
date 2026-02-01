import { array, boolean, date, number, object, string, union, z } from "zod";

export const salesOrderStatusSchema = z.enum([
  "borrador",
  "pendiente",
  "confirmada",
  "parcial",
  "despachada",
  "cancelada",
]);

// Customer schema for populated objects
export const customerSchema = object({
  _id: string(),
  nombre: string(),
  tipo: z.enum(["persona", "empresa"]),
  telefono: string().optional(),
  correo: string().optional(),
  rif: string().optional(),
  razonSocial: string().optional(),
});

// Item schema for populated objects
export const itemSchema = object({
  _id: string(),
  nombre: string(),
  codigo: string().optional(),
});

// Warehouse schema for reservations
export const warehouseSchema = object({
  _id: string(),
  nombre: string(),
  codigo: string().optional(),
});

export const salesLineSchema = object({
  _id: string().optional(),
  item: union([string().min(1, "El item es obligatorio"), itemSchema]),
  cantidad: number()
    .min(1, "La cantidad debe ser al menos 1")
    .refine((val) => val > 0, {
      message: "La cantidad debe ser mayor a 0",
    }),
  precioUnitario: number()
    .min(0, "El precio unitario no puede ser negativo")
    .default(0),
  reservado: number()
    .min(0, "La cantidad reservada no puede ser negativa")
    .default(0)
    .optional(),
  entregado: number()
    .min(0, "La cantidad entregada no puede ser negativa")
    .default(0)
    .optional(),
});

export const salesReservationSchema = object({
  _id: string(),
  item: itemSchema,
  warehouse: warehouseSchema,
  cantidad: number(),
  estado: z.enum(["activo", "liberado", "consumido", "cancelado"]),
  eliminado: boolean().optional(),
  historial: array(z.any()).optional(),
  createdAt: string().optional(),
  updatedAt: string().optional(),
});

export const salesOrderSchema = object({
  _id: string().optional(),
  id: string().optional(), // For backward compatibility
  numero: string()
    .min(1, "El número de orden es obligatorio")
    .max(50, "El número de orden no puede exceder los 50 caracteres")
    .optional(),
  customer: union([string().optional(), customerSchema.optional()]),
  fecha: union([string(), date()]).optional(),
  items: array(salesLineSchema)
    .min(1, "Debe incluir al menos un item en la orden")
    .refine((items) => items.length > 0, {
      message: "La orden debe tener al menos un item",
    }),
  estado: salesOrderStatusSchema.default("borrador").optional(),
  reservations: array(salesReservationSchema).optional(),

  // Idempotency keys
  confirmIdempotencyKey: string().optional(),
  shipIdempotencyKey: string().optional(),
  cancelIdempotencyKey: string().optional(),

  // Tracking dates
  fechaConfirmacion: string().optional(),
  fechaDespacho: string().optional(),
  fechaCancelacion: string().optional(),

  // Audit
  creadoPor: string().optional(),
  eliminado: boolean().default(false).optional(),
  historial: array(z.any()).optional(),
  createdAt: string().optional(),
  updatedAt: string().optional(),
});
