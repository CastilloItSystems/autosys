import { array, boolean, number, object, string, z } from "zod";

export const warehouseTypeSchema = z.enum([
  "almacen",
  "bodega",
  "taller",
  "otro",
]);

export const warehouseStatusSchema = z.enum(["activo", "inactivo"]);

export const warehouseSchema = object({
  id: string().optional(),
  nombre: string()
    .min(1, "El nombre es obligatorio")
    .max(100, "El nombre no puede exceder los 100 caracteres"),
  ubicacion: string()
    .max(200, "La ubicación no puede exceder los 200 caracteres")
    .optional(),
  tipo: warehouseTypeSchema.default("almacen").optional(),
  capacidad: number().min(0, "La capacidad no puede ser negativa").optional(),
  estado: warehouseStatusSchema.default("activo").optional(),
  eliminado: boolean().default(false).optional(),
  createdBy: string().optional(),
  historial: array(z.any()).optional(),
  createdAt: string().optional(),
  updatedAt: string().optional(),
});
