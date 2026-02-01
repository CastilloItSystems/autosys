import { boolean, number, object, string, z } from "zod";

export const movementTypeSchema = z.enum([
  "entrada",
  "salida",
  "transferencia",
  "ajuste",
]);

export const movementSchema = object({
  id: string().optional(),
  tipo: movementTypeSchema,
  referencia: string().optional(),
  item: string().min(1, "El item es obligatorio"),
  cantidad: number()
    .min(1, "La cantidad debe ser al menos 1")
    .refine((val) => val > 0, {
      message: "La cantidad debe ser mayor a 0",
    }),
  costoUnitario: number()
    .min(0, "El costo unitario no puede ser negativo")
    .optional(),
  warehouseFrom: string().optional(),
  warehouseTo: string().optional(),
  lote: string().optional(),
  usuario: string().optional(),
  metadata: z.any().optional(),
  eliminado: boolean().default(false).optional(),
  createdAt: string().optional(),
  updatedAt: string().optional(),
}).refine(
  (data) => {
    // Si es transferencia, debe tener warehouseFrom y warehouseTo
    if (data.tipo === "transferencia") {
      return data.warehouseFrom && data.warehouseTo;
    }
    // Si es entrada, debe tener warehouseTo
    if (data.tipo === "entrada") {
      return data.warehouseTo;
    }
    // Si es salida, debe tener warehouseFrom
    if (data.tipo === "salida") {
      return data.warehouseFrom;
    }
    return true;
  },
  {
    message: "Debe especificar los almacenes según el tipo de movimiento",
  }
);
