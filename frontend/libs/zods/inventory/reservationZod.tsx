import { boolean, number, object, string, z } from "zod";

export const reservationStatusSchema = z.enum([
  "activo",
  "liberado",
  "consumido",
  "cancelado",
]);

export const reservationSchema = object({
  id: string().optional(),
  item: string().min(1, "El item es obligatorio"),
  warehouse: string().min(1, "El almacén es obligatorio"),
  cantidad: number()
    .min(1, "La cantidad debe ser al menos 1")
    .refine((val) => val > 0, {
      message: "La cantidad debe ser mayor a 0",
    }),
  reservadoPor: string().optional(),
  motivo: string()
    .max(200, "El motivo no puede exceder los 200 caracteres")
    .optional(),
  estado: reservationStatusSchema.default("activo").optional(),
  eliminado: boolean().default(false).optional(),
  createdAt: string().optional(),
  updatedAt: string().optional(),
});
