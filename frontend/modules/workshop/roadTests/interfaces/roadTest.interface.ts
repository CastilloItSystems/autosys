// libs/interfaces/workshop/roadTest.interface.ts
import type { OrderRef } from '@/modules/workshop/shared/interfaces/shared.interface'

export type RoadTestStatus =
  | 'DRAFT'
  | 'AUTHORIZED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'

export type RoadTestResult = 'PASS' | 'FAIL' | 'WITH_OBSERVATIONS'

export type AuthorizerRole = 'MANAGER' | 'ADVISOR' | 'SHOP_FOREMAN'

export interface RoadTest {
  id: string
  serviceOrderId: string
  serviceOrder?: OrderRef | null
  exitPassRef: string | null
  motive: string
  notes: string | null
  driverId: string
  driverName: string | null
  technicianId: string
  technicianName: string | null
  authManagerId: string | null
  authManagerAt: string | null
  authAdvisorId: string | null
  authAdvisorAt: string | null
  authShopForemanId: string | null
  authShopForemanAt: string | null
  clientAuthorized: boolean
  clientAuthorizedAt: string | null
  clientAuthName: string | null
  clientAuthSignature: string | null
  kmDeparture: number | null
  kmReturn: number | null
  departedAt: string | null
  returnedAt: string | null
  result: RoadTestResult | null
  leaksDetected: boolean | null
  integrityVerified: boolean | null
  observations: string | null
  status: RoadTestStatus
  empresaId: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface RoadTestFilters {
  serviceOrderId?: string
  status?: RoadTestStatus
  page?: number
  limit?: number
}

export interface CreateRoadTestInput {
  serviceOrderId: string
  motive: string
  driverId: string
  driverName?: string
  technicianId: string
  technicianName?: string
  exitPassRef?: string
  notes?: string
}

export interface AuthorizeInput {
  role: AuthorizerRole
  userId: string
}

export interface ClientAuthorizeInput {
  clientName: string
  signatureUrl?: string
}

export interface DepartInput {
  kmDeparture: number
}

export interface ReturnInput {
  kmReturn: number
  leaksDetected?: boolean
  integrityVerified?: boolean
  result: RoadTestResult
  observations?: string
}
