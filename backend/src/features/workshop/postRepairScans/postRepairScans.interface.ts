// backend/src/features/workshop/postRepairScans/postRepairScans.interface.ts

export type PostRepairScanResult = 'PASS' | 'FAIL' | 'WITH_OBSERVATIONS'

export interface ICreatePostRepairScan {
  serviceOrderId: string
  technicianId: string
  technicianName?: string | null
  dtcCodesCleared?: any
  parametersVerified?: any
  result: PostRepairScanResult
  reportUrl?: string | null
  reportPrinted?: boolean
  observations?: string | null
}

export interface IUpdatePostRepairScan extends Partial<ICreatePostRepairScan> {}
