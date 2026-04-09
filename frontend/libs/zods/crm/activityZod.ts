// libs/zods/crm/activityZod.ts

import { z } from "zod";

export const createActivitySchema = z.object({
  customerId: z.string().uuid("UUID inválido").min(1, "El cliente es requerido"),
  type: z.enum(["CALL", "EMAIL", "WHATSAPP", "MEETING", "QUOTE", "TASK"], {
    required_error: "El tipo es requerido",
  }),
  title: z.string().min(1, "El título es requerido").max(255, "Máximo 255 caracteres"),
  assignedTo: z.string().uuid("UUID inválido").min(1, "El responsable es requerido"),
  dueAt: z.string().min(1, "La fecha límite es requerida"),
  leadId: z.string().uuid("UUID inválido").optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
});

export const updateActivitySchema = createActivitySchema.partial();

export const completeActivitySchema = z.object({
  outcome: z.string().optional().or(z.literal("")),
  completedAt: z.string().optional().or(z.literal("")),
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
export type CompleteActivityInput = z.infer<typeof completeActivitySchema>;
