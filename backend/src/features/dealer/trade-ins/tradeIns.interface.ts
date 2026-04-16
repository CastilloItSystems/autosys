import { DealerTradeInStatus } from '../../../generated/prisma/client.js'

export interface IDealerTradeIn {
  id: string
  empresaId: string
  targetDealerUnitId?: string | null
  tradeInNumber: string
  status: DealerTradeInStatus
  customerName: string
  customerDocument?: string | null
  customerPhone?: string | null
  customerEmail?: string | null
  vehicleBrand: string
  vehicleModel?: string | null
  vehicleYear?: number | null
  vehicleVersion?: string | null
  vehicleVin?: string | null
  vehiclePlate?: string | null
  mileage?: number | null
  conditionSummary?: string | null
  requestedValue?: any | null
  appraisedValue?: any | null
  approvedValue?: any | null
  appraisalDate?: Date | null
  appraiserName?: string | null
  notes?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  targetDealerUnit?: {
    id: string
    code?: string | null
    vin?: string | null
    brand: { id: string; code: string; name: string }
    model?: { id: string; name: string; year?: number | null } | null
  } | null
}

export interface IDealerTradeInFilters {
  targetDealerUnitId?: string
  status?: string
  isActive?: boolean
  search?: string
  fromDate?: Date
  toDate?: Date
}
