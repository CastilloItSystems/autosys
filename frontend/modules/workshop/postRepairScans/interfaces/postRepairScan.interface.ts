// libs/interfaces/workshop/postRepairScan.interface.ts
import type { OrderRef } from '@/modules/workshop/shared/interfaces/shared.interface'

export type PostRepairScanResult = 'PASS' | 'FAIL' | 'WITH_OBSERVATIONS'

export interface PostRepairScan {
  id: string
  serviceOrderId: string
  serviceOrder?: OrderRef | null
  technicianId: string
  technicianName: string | null
  performedAt: string
  dtcCodesCleared: string[] | null
  parametersVerified: Record<string, unknown> | null
  result: PostRepairScanResult
  reportUrl: string | null
  reportPrinted: boolean
  observations: string | null
  empresaId: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface PostRepairScanFilters {
  serviceOrderId?: string
  result?: PostRepairScanResult
  page?: number
  limit?: number
}

export interface CreatePostRepairScanInput {
  serviceOrderId: string
  technicianId: string
  technicianName?: string
  dtcCodesCleared?: string[]
  parametersVerified?: Record<string, unknown>
  result: PostRepairScanResult
  reportUrl?: string
  reportPrinted?: boolean
  observations?: string
}
