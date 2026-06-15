import { z } from "zod";

export const dealerCommissionEditSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "PAID", "CANCELLED"]),
  commissionPct: z.number().min(0).max(100).optional(),
  sellerName: z.string().optional(),
  notes: z.string().optional(),
});

export type DealerCommissionEditSchema = z.infer<
  typeof dealerCommissionEditSchema
>;
