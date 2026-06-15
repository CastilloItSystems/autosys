// backend/src/features/workshop/roadTests/roadTests.interface.ts

export type RoadTestStatus =
  | 'DRAFT'
  | 'AUTHORIZED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'

export type RoadTestResult = 'PASS' | 'FAIL' | 'WITH_OBSERVATIONS'

export interface ICreateRoadTest {
  serviceOrderId: string
  motive: string
  driverId: string
  driverName?: string | null
  technicianId: string
  technicianName?: string | null
  exitPassRef?: string | null
  notes?: string | null
}

export interface IUpdateRoadTest {
  motive?: string
  notes?: string | null
  exitPassRef?: string | null
}

export type AuthorizerRole = 'MANAGER' | 'ADVISOR' | 'SHOP_FOREMAN'

export interface IAuthorizeInput {
  role: AuthorizerRole
  userId: string
}

export interface IClientAuthorizeInput {
  clientName: string
  signatureUrl?: string | null
}

export interface IDepartInput {
  kmDeparture: number
}

export interface IReturnInput {
  kmReturn: number
  leaksDetected?: boolean
  integrityVerified?: boolean
  result: RoadTestResult
  observations?: string | null
}
