import { z } from "zod";

export const unitSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1, "Código es requerido").optional(),
  name: z.string().min(1, "Nombre es requerido"),
  description: z.string().optional(),
  abbreviation: z.string().optional(),
  type: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type UnitZ = z.infer<typeof unitSchema>;
