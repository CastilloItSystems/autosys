import { array, boolean, number, object, string, z } from "zod";

export const brandSchema = object({
  id: string().optional(),
  nombre: string(),
  eliminado: boolean().optional(),
});

export const categorySchema = object({
  id: string().optional(),
  nombre: string(),
  eliminado: boolean().optional(),
});

export const itemModelSchema = object({
  id: string().optional(),
  nombre: string(),
  marca: z.union([string(), brandSchema]).optional(),
  eliminado: boolean().optional(),
});

export const itemSchema = object({
  id: string().optional(),
  sku: string().optional(),
  codigo: string().optional(),
  nombre: string()
    .min(1, "El nombre es obligatorio")
    .max(100, "El nombre no puede exceder los 100 caracteres"),
  descripcion: string()
    .max(500, "La descripción no puede exceder los 500 caracteres")
    .optional(),
  marca: z
    .union([
      string().max(50, "La marca no puede exceder los 50 caracteres"),
      brandSchema,
    ])
    .optional(),
  modelo: z
    .union([
      string().max(50, "El modelo no puede exceder los 50 caracteres"),
      itemModelSchema,
    ])
    .optional(),
  categoria: z
    .union([
      string().max(50, "La categoría no puede exceder los 50 caracteres"),
      categorySchema,
    ])
    .optional(),
  unidad: string().default("unidad").optional(),
  precioCosto: number()
    .min(0, "El precio de costo no puede ser negativo")
    .default(0)
    .optional(),
  precioVenta: number()
    .min(0, "El precio de venta no puede ser negativo")
    .default(0)
    .optional(),
  stockMinimo: number()
    .min(0, "El stock mínimo no puede ser negativo")
    .default(0)
    .optional(),
  stockMaximo: number()
    .min(0, "El stock máximo no puede ser negativo")
    .default(0)
    .optional(),
  imagenes: array(string().url("Debe ser una URL válida")).optional(),
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
