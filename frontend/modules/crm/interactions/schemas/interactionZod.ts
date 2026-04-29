// libs/zods/crm/interactionZod.ts

import { z } from "zod";

export const createInteractionSchema = z.object({
  customerId: z.string().uuid("UUID inválido").min(1, "El cliente es requerido"),
  type: z.enum([
    "CALL", "WHATSAPP", "EMAIL", "VISIT",
    "NOTE", "QUOTE", "FOLLOW_UP", "MEETING",
  ], {
    required_error: "El tipo es requerido",
  }),
  notes: z.string().min(1, "Las notas son requeridas"),
  channel: z
    .enum(["REPUESTOS", "TALLER", "VEHICULOS", "GENERAL"])
    .default("GENERAL"),
  direction: z.enum(["INBOUND", "OUTBOUND"]).default("OUTBOUND"),
  leadId: z.string().uuid("UUID inválido").optional().or(z.literal("")),
  subject: z.string().max(255).optional().or(z.literal("")),
  outcome: z.string().optional().or(z.literal("")),
  nextAction: z.string().optional().or(z.literal("")),
  nextActionAt: z.string().optional().or(z.literal("")),
});

export const updateInteractionSchema = createInteractionSchema.partial();

export type CreateInteractionInput = z.infer<typeof createInteractionSchema>;
export type UpdateInteractionInput = z.infer<typeof updateInteractionSchema>;
