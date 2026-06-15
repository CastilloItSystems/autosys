import { z } from "zod";

export const dealerPolicySchema = z.object({
  quoteValidityDays: z.number().int().min(1).max(365),
  reservationValidityDays: z.number().int().min(1).max(365),
  minDepositAmount: z.number().min(0).nullable().optional(),
  minDepositPct: z.number().min(0).max(100).nullable().optional(),
  maxDiscountPctAdvisor: z.number().min(0).max(100),
  maxDiscountPctSupervisor: z.number().min(0).max(100),
  maxDiscountPctManager: z.number().min(0).max(100),
  requireTestDrive: z.boolean(),
  requireAppraisalForTradeIn: z.boolean(),
  requireDepositForReservation: z.boolean(),
  leadFollowUpSlaHours: z.number().int().min(1).max(2160),
  commissionPctDefault: z.number().min(0).max(100),
  alertWindowHours: z.number().int().min(1).max(720),
  notes: z.string().optional(),
});

export type DealerPolicySchema = z.infer<typeof dealerPolicySchema>;
