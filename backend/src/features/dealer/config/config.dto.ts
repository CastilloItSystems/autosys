import { IDealerPolicy } from './config.interface.js'

export class UpsertDealerPolicyDTO {
  quoteValidityDays?: number
  reservationValidityDays?: number
  minDepositAmount?: number | null
  minDepositPct?: number | null
  maxDiscountPctAdvisor?: number
  maxDiscountPctSupervisor?: number
  maxDiscountPctManager?: number
  requireTestDrive?: boolean
  requireAppraisalForTradeIn?: boolean
  requireDepositForReservation?: boolean
  leadFollowUpSlaHours?: number
  commissionPctDefault?: number
  alertWindowHours?: number
  notes?: string | null
  isActive?: boolean

  constructor(data: Record<string, unknown>) {
    if (data.quoteValidityDays !== undefined) this.quoteValidityDays = Number(data.quoteValidityDays)
    if (data.reservationValidityDays !== undefined) this.reservationValidityDays = Number(data.reservationValidityDays)
    if (data.minDepositAmount !== undefined) this.minDepositAmount = data.minDepositAmount !== null ? Number(data.minDepositAmount) : null
    if (data.minDepositPct !== undefined) this.minDepositPct = data.minDepositPct !== null ? Number(data.minDepositPct) : null
    if (data.maxDiscountPctAdvisor !== undefined) this.maxDiscountPctAdvisor = Number(data.maxDiscountPctAdvisor)
    if (data.maxDiscountPctSupervisor !== undefined) this.maxDiscountPctSupervisor = Number(data.maxDiscountPctSupervisor)
    if (data.maxDiscountPctManager !== undefined) this.maxDiscountPctManager = Number(data.maxDiscountPctManager)
    if (data.requireTestDrive !== undefined) this.requireTestDrive = Boolean(data.requireTestDrive)
    if (data.requireAppraisalForTradeIn !== undefined) this.requireAppraisalForTradeIn = Boolean(data.requireAppraisalForTradeIn)
    if (data.requireDepositForReservation !== undefined) this.requireDepositForReservation = Boolean(data.requireDepositForReservation)
    if (data.leadFollowUpSlaHours !== undefined) this.leadFollowUpSlaHours = Number(data.leadFollowUpSlaHours)
    if (data.commissionPctDefault !== undefined) this.commissionPctDefault = Number(data.commissionPctDefault)
    if (data.alertWindowHours !== undefined) this.alertWindowHours = Number(data.alertWindowHours)
    if (data.notes !== undefined) this.notes = data.notes ? String(data.notes).trim() : null
    if (data.isActive !== undefined) this.isActive = Boolean(data.isActive)
  }
}

export class DealerPolicyResponseDTO {
  id: string
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

  constructor(data: IDealerPolicy) {
    this.id = data.id
    this.quoteValidityDays = data.quoteValidityDays
    this.reservationValidityDays = data.reservationValidityDays
    this.minDepositAmount = data.minDepositAmount ?? null
    this.minDepositPct = data.minDepositPct ?? null
    this.maxDiscountPctAdvisor = data.maxDiscountPctAdvisor
    this.maxDiscountPctSupervisor = data.maxDiscountPctSupervisor
    this.maxDiscountPctManager = data.maxDiscountPctManager
    this.requireTestDrive = data.requireTestDrive
    this.requireAppraisalForTradeIn = data.requireAppraisalForTradeIn
    this.requireDepositForReservation = data.requireDepositForReservation
    this.leadFollowUpSlaHours = data.leadFollowUpSlaHours
    this.commissionPctDefault = data.commissionPctDefault
    this.alertWindowHours = data.alertWindowHours
    this.notes = data.notes ?? null
    this.isActive = data.isActive
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }
}
