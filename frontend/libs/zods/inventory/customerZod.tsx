import { z } from "zod";

export const customerSchema = z.object({
  id: z.string().optional(),
  _id: z.string().optional(),
  nombre: z.string().min(2, "Nombre requerido").max(100, "Nombre muy largo"),
  tipo: z.enum(["persona", "empresa"]),
  telefono: z.string().optional(),
  correo: z.string().email("Correo inválido").optional().or(z.literal("")),
  direccion: z.string().optional(),
  rif: z.string().optional(),
  razonSocial: z.string().optional(),
  notas: z.string().optional(),
  estado: z.enum(["activo", "inactivo"]).default("activo"),
  eliminado: z.boolean().optional(),
  nombreCompleto: z.string().optional(),
  vehicles: z.array(z.any()).optional(), // Para vehicles, usaremos any por ahora ya que es complejo
  createdBy: z.string().optional(),
  historial: z.array(z.any()).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  __v: z.number().optional(),
});

export type CustomerFormData = z.infer<typeof customerSchema>;
