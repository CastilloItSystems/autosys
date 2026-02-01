import { array, boolean, object, string, z } from "zod";

export const supplierSchema = object({
  id: string().optional(),
  nombre: string()
    .min(1, "El nombre es obligatorio")
    .max(100, "El nombre no puede exceder los 100 caracteres"),
  contacto: string()
    .max(100, "El contacto no puede exceder los 100 caracteres")
    .optional(),
  telefono: string()
    .max(20, "El teléfono no puede exceder los 20 caracteres")
    .optional(),
  correo: string().email("Debe ser un correo válido").optional(),
  direccion: string()
    .max(200, "La dirección no puede exceder los 200 caracteres")
    .optional(),
  condicionesPago: string()
    .max(200, "Las condiciones de pago no pueden exceder los 200 caracteres")
    .optional(),
  estado: string()
    .refine((val) => val === "activo" || val === "inactivo", {
      message: "El estado debe ser 'activo' o 'inactivo'",
    })
    .optional(),
  eliminado: boolean().default(false).optional(),
  createdBy: string().optional(),
  historial: array(z.any()).optional(),
  createdAt: string().optional(),
  updatedAt: string().optional(),
});
