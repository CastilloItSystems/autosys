import { z } from "zod";

// Service Category validation schema
export const serviceCategorySchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  descripcion: z.string().optional(),
  codigo: z.string().min(2, "El código debe tener al menos 2 caracteres"),
  color: z.string().optional(),
  icono: z.string().optional(),
  orden: z.number().int().min(0).optional(),
  activo: z.boolean().default(true),
});

export type ServiceCategoryFormData = z.infer<typeof serviceCategorySchema>;

// Service Subcategory validation schema
export const serviceSubcategorySchema = z.object({
  categoria: z.string().min(1, "Debe seleccionar una categoría"),
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  descripcion: z.string().optional(),
  codigo: z.string().min(2, "El código debe tener al menos 2 caracteres"),
  activo: z.boolean().default(true),
});

export type ServiceSubcategoryFormData = z.infer<
  typeof serviceSubcategorySchema
>;
