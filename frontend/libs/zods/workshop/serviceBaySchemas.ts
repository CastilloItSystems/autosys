import { z } from "zod";

/**
 * Zod Schemas para Service Bay
 */

// Enums
export const bayAreaSchema = z.enum([
  "mecanica",
  "electricidad",
  "pintura",
  "latoneria",
  "diagnostico",
  "cambio_aceite",
  "multiple",
]);

export const bayStatusSchema = z.enum([
  "disponible",
  "ocupado",
  "mantenimiento",
  "fuera_servicio",
]);

export const bayCapacitySchema = z.enum([
  "individual",
  "pequeña",
  "mediana",
  "grande",
  "multiple",
]);

// Schema para crear una bahía de servicio
export const createServiceBaySchema = z.object({
  name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),

  code: z
    .string()
    .min(2, "El código debe tener al menos 2 caracteres")
    .max(20, "El código no puede exceder 20 caracteres")
    .regex(
      /^[A-Z0-9-]+$/,
      "El código debe contener solo letras mayúsculas, números y guiones"
    ),

  area: bayAreaSchema,

  capacity: bayCapacitySchema,

  maxTechnicians: z
    .number()
    .int("Debe ser un número entero")
    .min(1, "Debe permitir al menos 1 técnico")
    .max(10, "No puede exceder 10 técnicos"),

  equipment: z.array(z.string()).optional().default([]),

  notes: z
    .string()
    .max(500, "Las notas no pueden exceder 500 caracteres")
    .optional(),

  order: z
    .number()
    .int("Debe ser un número entero")
    .min(0, "El orden no puede ser negativo")
    .optional()
    .default(0),
});

// Schema para actualizar una bahía de servicio
export const updateServiceBaySchema = z.object({
  name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .optional(),

  code: z
    .string()
    .min(2, "El código debe tener al menos 2 caracteres")
    .max(20, "El código no puede exceder 20 caracteres")
    .regex(
      /^[A-Z0-9-]+$/,
      "El código debe contener solo letras mayúsculas, números y guiones"
    )
    .optional(),

  area: bayAreaSchema.optional(),

  status: bayStatusSchema.optional(),

  capacity: bayCapacitySchema.optional(),

  maxTechnicians: z
    .number()
    .int("Debe ser un número entero")
    .min(1, "Debe permitir al menos 1 técnico")
    .max(10, "No puede exceder 10 técnicos")
    .optional(),

  equipment: z.array(z.string()).optional(),

  notes: z
    .string()
    .max(500, "Las notas no pueden exceder 500 caracteres")
    .optional(),

  order: z
    .number()
    .int("Debe ser un número entero")
    .min(0, "El orden no puede ser negativo")
    .optional(),
});

// Schema para filtros de búsqueda
export const serviceBayFiltersSchema = z.object({
  status: bayStatusSchema.optional(),
  area: bayAreaSchema.optional(),
  sortBy: z.enum(["name", "code", "order", "createdAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

// Types inferidos de los schemas
export type CreateServiceBayInput = z.infer<typeof createServiceBaySchema>;
export type UpdateServiceBayInput = z.infer<typeof updateServiceBaySchema>;
export type ServiceBayFiltersInput = z.infer<typeof serviceBayFiltersSchema>;
