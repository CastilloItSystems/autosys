export interface IDealerPolicy {
  id: string
  empresaId: string
  quoteValidityDays: number
  reservationValidityDays: number
  minDepositAmount?: any | null
  minDepositPct?: any | null
  maxDiscountPctAdvisor: any
  maxDiscountPctSupervisor: any
  maxDiscountPctManager: any
  requireTestDrive: boolean
  requireAppraisalForTradeIn: boolean
  requireDepositForReservation: boolean
  leadFollowUpSlaHours: number
  commissionPctDefault: any
  alertWindowHours: number
  notes?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

/** Política resuelta con valores numéricos planos (defaults aplicados). */
export interface IResolvedDealerPolicy {
  quoteValidityDays: number
  reservationValidityDays: number
  minDepositAmount: number | null
  minDepositPct: number | null
  maxDiscountPctAdvisor: number
  maxDiscountPctSupervisor: number
  maxDiscountPctManager: number
  requireTestDrive: boolean
  requireAppraisalForTradeIn: boolean
  requireDepositForReservation: boolean
  leadFollowUpSlaHours: number
  commissionPctDefault: number
  alertWindowHours: number
}
