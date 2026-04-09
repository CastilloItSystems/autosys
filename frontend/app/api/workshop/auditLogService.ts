// app/api/workshop/auditLogService.ts
import apiClient from '../apiClient'
import type { WorkshopPagedResponse } from '@/libs/interfaces/workshop'

export type AuditEntityType =
  | 'SERVICE_ORDER'
  | 'VEHICLE_RECEPTION'
  | 'SERVICE_APPOINTMENT'
  | 'WORKSHOP_WARRANTY'
  | 'WORKSHOP_REWORK'
  | 'QUALITY_CHECK'
  | 'LABOR_TIME'
  | 'SERVICE_ORDER_MATERIAL'
  | 'VEHICLE_DELIVERY'

export type AuditAction =
  | 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE'
  | 'REOPEN' | 'APPROVE' | 'REJECT' | 'CANCEL' | 'ASSIGN' | 'DELIVER'

export interface AuditLogEntry {
  id: string
  entityType: AuditEntityType
  entityId: string
  action: AuditAction
  userId: string
  userName?: string
  previousData?: Record<string, any> | null
  newData?: Record<string, any> | null
  notes?: string | null
  createdAt: string
}

export interface AuditLogFilters {
  entityType?: AuditEntityType
  entityId?: string
  action?: AuditAction
  userId?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

const BASE = '/workshop/audit-log'

const auditLogService = {
  async getAll(filters: AuditLogFilters): Promise<WorkshopPagedResponse<AuditLogEntry>> {
    const res = await apiClient.get(BASE, { params: filters })
    return res.data
  },
}

export default auditLogService
