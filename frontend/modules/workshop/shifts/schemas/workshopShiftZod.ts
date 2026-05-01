import { z } from "zod";

export const createWorkshopShiftSchema = z.object({
  code: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .max(20, "Máximo 20 caracteres")
    .transform((val) => val.toUpperCase()),
  name: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .max(100, "Máximo 100 caracteres"),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
  workDays: z
    .array(z.number().min(0).max(6))
    .min(1, "Seleccione al menos un día"),
});

export const updateWorkshopShiftSchema = createWorkshopShiftSchema.partial();

export type CreateWorkshopShiftForm = z.infer<typeof createWorkshopShiftSchema>;
export type UpdateWorkshopShiftForm = z.infer<typeof updateWorkshopShiftSchema>;
