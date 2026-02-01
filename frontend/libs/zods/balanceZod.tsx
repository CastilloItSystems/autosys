import { array, boolean, date, number, object, string, union, z } from "zod";
import { contratoSchema } from "./contratoZod";
import { facturaSchema } from "./facturaZod";

export const balanceSchema = object({
  _id: string().optional(),
  idRefineria: z
    .object({
      _id: z.string().optional(),
      nombre: z.string().min(1, "El nombre de la refinería es obligatorio"),
      id: z.string().min(1, "El ID de la refinería es obligatorio"),
    })
    .optional(),
  fechaInicio: union([string(), date()]).optional(),
  fechaFin: union([string(), date()]).optional(),
  contratosCompras: array(contratoSchema).optional(),
  contratosVentas: array(contratoSchema).optional(),
  facturas: array(facturaSchema).optional(),
  totalCompras: number().optional(),
  totalVentas: number().optional(),
  ganancia: number().optional(),
  perdida: number().optional(),

  id: string().optional(),
});
