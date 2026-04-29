import { z } from "zod";

export const dealerApprovalSchema = z.object({
  type: z.string({ required_error: "Tipo requerido" }).min(1, "Tipo requerido"),
  status: z
    .string({ required_error: "Estatus requerido" })
    .min(1, "Estatus requerido"),
  title: z
    .string({ required_error: "Título requerido" })
    .min(1, "Título requerido"),
  reason: z.string().optional(),
  requestedAmount: z.number().min(0).optional(),
  requestedPct: z.number().min(0).max(100).optional(),
  resolutionNotes: z.string().optional(),
});

export type DealerApprovalSchema = z.infer<typeof dealerApprovalSchema>;
