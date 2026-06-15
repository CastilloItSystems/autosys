export interface DealerPolicy {
  id: string;
  quoteValidityDays: number;
  reservationValidityDays: number;
  minDepositAmount?: string | number | null;
  minDepositPct?: string | number | null;
  maxDiscountPctAdvisor: string | number;
  maxDiscountPctSupervisor: string | number;
  maxDiscountPctManager: string | number;
  requireTestDrive: boolean;
  requireAppraisalForTradeIn: boolean;
  requireDepositForReservation: boolean;
  leadFollowUpSlaHours: number;
  commissionPctDefault: string | number;
  alertWindowHours: number;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
