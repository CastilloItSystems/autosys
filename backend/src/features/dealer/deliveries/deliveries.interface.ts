import { DealerDeliveryStatus } from '../../../generated/prisma/client.js'

export interface IDealerDelivery {
  id: string
  empresaId: string
  dealerUnitId: string
  deliveryNumber: string
  status: DealerDeliveryStatus
  customerName: string
  customerDocument?: string | null
  customerPhone?: string | null
  customerEmail?: string | null
  scheduledAt: Date
  deliveredAt?: Date | null
  advisorName?: string | null
  checklistCompleted: boolean
  documentsSigned: boolean
  accessoriesDelivered: boolean
  observations?: string | null
  actNumber?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  dealerUnit: {
    id: string
    code?: string | null
    vin?: string | null
    brand: { id: string; code: string; name: string }
    model?: { id: string; name: string; year?: number | null } | null
  }
}

export interface IDealerDeliveryFilters {
  dealerUnitId?: string
  status?: string
  isActive?: boolean
  search?: string
  fromDate?: Date
  toDate?: Date
}
