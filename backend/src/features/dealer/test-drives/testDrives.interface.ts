import { DealerTestDriveStatus } from '../../../generated/prisma/client.js'

export interface IDealerTestDriveUnit {
  id: string
  code?: string | null
  vin?: string | null
  plate?: string | null
  brand: {
    id: string
    code: string
    name: string
  }
  model?: {
    id: string
    name: string
    year?: number | null
  } | null
}

export interface IDealerTestDrive {
  id: string
  empresaId: string
  dealerUnitId: string
  testDriveNumber: string
  status: DealerTestDriveStatus
  customerName: string
  customerDocument?: string | null
  customerPhone?: string | null
  customerEmail?: string | null
  driverLicense?: string | null
  scheduledAt: Date
  startedAt?: Date | null
  completedAt?: Date | null
  cancelledAt?: Date | null
  advisorName?: string | null
  routeDescription?: string | null
  observations?: string | null
  customerFeedback?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  dealerUnit: IDealerTestDriveUnit
}

export interface IDealerTestDriveFilters {
  dealerUnitId?: string
  status?: string
  isActive?: boolean
  search?: string
  fromDate?: Date
  toDate?: Date
}
