// libs/zods/crm/leadZod.ts

import { z } from "zod";

export const createLeadSchema = z.object({
  title: z.string().min(1, "El título es requerido").max(255, "Máximo 255 caracteres"),
  channel: z.enum(["REPUESTOS", "TALLER", "VEHICULOS"], {
    required_error: "El canal es requerido",
  }),
  source: z.enum([
    "WALK_IN", "REFERRAL", "PHONE", "WHATSAPP",
    "SOCIAL_MEDIA", "WEBSITE", "EMAIL", "OTHER",
  ], {
    required_error: "La fuente es requerida",
  }),
  customerId: z.string().uuid("UUID inválido").optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  estimatedValue: z.coerce.number().min(0).optional().nullable(),
  currency: z.string().default("USD"),
  assignedTo: z.string().uuid("UUID inválido").optional().or(z.literal("")),
  expectedCloseAt: z.string().optional().or(z.literal("")),
});

export const updateLeadSchema = createLeadSchema.partial();

export const updateLeadStatusSchema = z
  .object({
    status: z.enum([
      "NEW", "CONTACTED", "QUALIFIED",
      "PROPOSAL", "NEGOTIATION", "WON", "LOST",
    ], {
      required_error: "El estado es requerido",
    }),
    lostReason: z.string().optional().or(z.literal("")),
    closedAt: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.status === "LOST" && !data.lostReason?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lostReason"],
        message: "Debes indicar el motivo de pérdida",
      });
    }
  });

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type UpdateLeadStatusInput = z.infer<typeof updateLeadStatusSchema>;
