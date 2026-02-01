import { array, boolean, number, object, string, z } from "zod";

export const stockSchema = object({
  id: string().optional(),
  item: string().min(1, "El item es obligatorio"),
  warehouse: string().min(1, "El almacén es obligatorio"),
  cantidad: number()
    .min(0, "La cantidad no puede ser negativa")
    .default(0)
    .optional(),
  costoPromedio: number()
    .min(0, "El costo promedio no puede ser negativo")
    .default(0)
    .optional(),
  lote: string().optional(),
  ubicacionZona: string()
    .max(100, "La ubicación no puede exceder los 100 caracteres")
    .optional(),
  reservado: number()
    .min(0, "La cantidad reservada no puede ser negativa")
    .default(0)
    .optional(),
  eliminado: boolean().default(false).optional(),
  createdBy: string().optional(),
  historial: array(z.any()).optional(),
  createdAt: string().optional(),
  updatedAt: string().optional(),
});
