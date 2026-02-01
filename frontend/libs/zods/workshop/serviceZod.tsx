import { z } from "zod";

// Service validation schema
export const serviceSchema = z.object({
  codigo: z.string().min(2, "El código debe tener al menos 2 caracteres"),
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  descripcion: z
    .string()
    .min(5, "La descripción debe tener al menos 5 caracteres"),
  categoria: z.string().min(1, "Debe seleccionar una categoría"),
  subcategoria: z.string().optional(),
  precioBase: z.number().min(0, "El precio debe ser mayor o igual a 0"),
  tiempoEstimadoMinutos: z
    .number()
    .int()
    .min(1, "El tiempo debe ser al menos 1 minuto"),
  unidadTiempo: z.enum(["minutos", "horas", "dias"]).default("minutos"),
  costoHoraAdicional: z
    .number()
    .min(0, "El costo debe ser mayor o igual a 0")
    .default(0),
  dificultad: z.enum(["baja", "media", "alta", "experto"]).default("media"),
  requiereEspecialista: z.boolean().default(false),
  garantiaMeses: z
    .number()
    .int()
    .min(0, "La garantía debe ser mayor o igual a 0")
    .default(0),
  herramientasRequeridas: z.array(z.string()).default([]),
  piezasComunes: z.array(z.string()).default([]),
  activo: z.boolean().default(true),
});

export type ServiceFormData = z.infer<typeof serviceSchema>;
