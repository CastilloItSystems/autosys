import { z } from "zod";

export const unitSchema = z.object({
  id: z.string().optional(),
  nombre: z.string().min(1, "Nombre es requerido"),
  descripcion: z.string().optional(),
  abreviacion: z.string().optional(),
  eliminado: z.boolean().optional(),
});

export type UnitZ = z.infer<typeof unitSchema>;
