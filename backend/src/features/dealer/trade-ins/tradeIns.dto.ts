import { IDealerTradeIn } from './tradeIns.interface.js'

export class CreateDealerTradeInDTO {
  targetDealerUnitId?: string
  customerName: string
  customerDocument?: string
  customerPhone?: string
  customerEmail?: string
  vehicleBrand: string
  vehicleModel?: string
  vehicleYear?: number | null
  vehicleVersion?: string
  vehicleVin?: string
  vehiclePlate?: string
  mileage?: number | null
  conditionSummary?: string
  requestedValue?: number | null
  appraisedValue?: number | null
  approvedValue?: number | null
  appraisalDate?: Date | null
  appraiserName?: string
  notes?: string
  status?: string

  constructor(data: Record<string, unknown>) {
    this.customerName = String(data.customerName).trim()
    this.vehicleBrand = String(data.vehicleBrand).trim()
    if (data.targetDealerUnitId != null && String(data.targetDealerUnitId).trim() !== '')
      this.targetDealerUnitId = String(data.targetDealerUnitId).trim()
    if (data.customerDocument != null && String(data.customerDocument).trim() !== '')
      this.customerDocument = String(data.customerDocument).trim()
    if (data.customerPhone != null && String(data.customerPhone).trim() !== '')
      this.customerPhone = String(data.customerPhone).trim()
    if (data.customerEmail != null && String(data.customerEmail).trim() !== '')
      this.customerEmail = String(data.customerEmail).trim()
    if (data.vehicleModel != null && String(data.vehicleModel).trim() !== '')
      this.vehicleModel = String(data.vehicleModel).trim()
    if (data.vehicleYear !== undefined) this.vehicleYear = data.vehicleYear !== null ? Number(data.vehicleYear) : null
    if (data.vehicleVersion != null && String(data.vehicleVersion).trim() !== '')
      this.vehicleVersion = String(data.vehicleVersion).trim()
    if (data.vehicleVin != null && String(data.vehicleVin).trim() !== '') this.vehicleVin = String(data.vehicleVin).trim()
    if (data.vehiclePlate != null && String(data.vehiclePlate).trim() !== '')
      this.vehiclePlate = String(data.vehiclePlate).trim()
    if (data.mileage !== undefined) this.mileage = data.mileage !== null ? Number(data.mileage) : null
    if (data.conditionSummary != null && String(data.conditionSummary).trim() !== '')
      this.conditionSummary = String(data.conditionSummary).trim()
    if (data.requestedValue !== undefined) this.requestedValue = data.requestedValue !== null ? Number(data.requestedValue) : null
    if (data.appraisedValue !== undefined) this.appraisedValue = data.appraisedValue !== null ? Number(data.appraisedValue) : null
    if (data.approvedValue !== undefined) this.approvedValue = data.approvedValue !== null ? Number(data.approvedValue) : null
    if (data.appraisalDate !== undefined) this.appraisalDate = data.appraisalDate ? new Date(String(data.appraisalDate)) : null
    if (data.appraiserName != null && String(data.appraiserName).trim() !== '')
      this.appraiserName = String(data.appraiserName).trim()
    if (data.notes != null && String(data.notes).trim() !== '') this.notes = String(data.notes).trim()
    if (data.status != null && String(data.status).trim() !== '') this.status = String(data.status).trim()
  }
}

export class UpdateDealerTradeInDTO {
  targetDealerUnitId?: string
  customerName?: string
  customerDocument?: string | null
  customerPhone?: string | null
  customerEmail?: string | null
  vehicleBrand?: string
  vehicleModel?: string | null
  vehicleYear?: number | null
  vehicleVersion?: string | null
  vehicleVin?: string | null
  vehiclePlate?: string | null
  mileage?: number | null
  conditionSummary?: string | null
  requestedValue?: number | null
  appraisedValue?: number | null
  approvedValue?: number | null
  appraisalDate?: Date | null
  appraiserName?: string | null
  notes?: string | null
  status?: string
  isActive?: boolean

  constructor(data: Record<string, unknown>) {
    if (data.targetDealerUnitId !== undefined)
      this.targetDealerUnitId = data.targetDealerUnitId ? String(data.targetDealerUnitId).trim() : undefined
    if (data.customerName !== undefined) this.customerName = String(data.customerName).trim()
    if (data.customerDocument !== undefined) this.customerDocument = data.customerDocument ? String(data.customerDocument).trim() : null
    if (data.customerPhone !== undefined) this.customerPhone = data.customerPhone ? String(data.customerPhone).trim() : null
    if (data.customerEmail !== undefined) this.customerEmail = data.customerEmail ? String(data.customerEmail).trim() : null
    if (data.vehicleBrand !== undefined) this.vehicleBrand = String(data.vehicleBrand).trim()
    if (data.vehicleModel !== undefined) this.vehicleModel = data.vehicleModel ? String(data.vehicleModel).trim() : null
    if (data.vehicleYear !== undefined) this.vehicleYear = data.vehicleYear !== null ? Number(data.vehicleYear) : null
    if (data.vehicleVersion !== undefined) this.vehicleVersion = data.vehicleVersion ? String(data.vehicleVersion).trim() : null
    if (data.vehicleVin !== undefined) this.vehicleVin = data.vehicleVin ? String(data.vehicleVin).trim() : null
    if (data.vehiclePlate !== undefined) this.vehiclePlate = data.vehiclePlate ? String(data.vehiclePlate).trim() : null
    if (data.mileage !== undefined) this.mileage = data.mileage !== null ? Number(data.mileage) : null
    if (data.conditionSummary !== undefined)
      this.conditionSummary = data.conditionSummary ? String(data.conditionSummary).trim() : null
    if (data.requestedValue !== undefined) this.requestedValue = data.requestedValue !== null ? Number(data.requestedValue) : null
    if (data.appraisedValue !== undefined) this.appraisedValue = data.appraisedValue !== null ? Number(data.appraisedValue) : null
    if (data.approvedValue !== undefined) this.approvedValue = data.approvedValue !== null ? Number(data.approvedValue) : null
    if (data.appraisalDate !== undefined) this.appraisalDate = data.appraisalDate ? new Date(String(data.appraisalDate)) : null
    if (data.appraiserName !== undefined) this.appraiserName = data.appraiserName ? String(data.appraiserName).trim() : null
    if (data.notes !== undefined) this.notes = data.notes ? String(data.notes).trim() : null
    if (data.status !== undefined) this.status = String(data.status).trim()
    if (data.isActive !== undefined) this.isActive = Boolean(data.isActive)
  }
}

export class DealerTradeInResponseDTO {
  id: string
  tradeInNumber: string
  status: string
  customerName: string
  vehicleBrand: string
  vehicleModel?: string | null
  requestedValue?: any | null
  appraisedValue?: any | null
  approvedValue?: any | null
  createdAt: Date
  targetDealerUnit?: IDealerTradeIn['targetDealerUnit']

  constructor(data: IDealerTradeIn) {
    this.id = data.id
    this.tradeInNumber = data.tradeInNumber
    this.status = data.status
    this.customerName = data.customerName
    this.vehicleBrand = data.vehicleBrand
    this.createdAt = data.createdAt
    if (data.vehicleModel != null) this.vehicleModel = data.vehicleModel
    if (data.requestedValue != null) this.requestedValue = data.requestedValue
    if (data.appraisedValue != null) this.appraisedValue = data.appraisedValue
    if (data.approvedValue != null) this.approvedValue = data.approvedValue
    if (data.targetDealerUnit !== undefined) this.targetDealerUnit = data.targetDealerUnit
  }
}
