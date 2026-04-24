export interface NotificationDTO {
  id: string
  empresaId: string
  userId: string
  eventCode: string
  module: string
  channel: string
  title: string
  message: string
  type: string
  entityType?: string
  entityId?: string
  priority: string
  severity: string
  link?: string
  source?: string
  dedupKey?: string
  isMandatory: boolean
  read: boolean
  createdBy?: {
    id?: string
    nombre?: string
  }
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface NotificationListQuery {
  page?: number
  limit?: number
  read?: boolean
  eventCode?: string
  module?: string
  severity?: string
}

export interface NotificationListResponse {
  items: NotificationDTO[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface NotificationCompanyPolicyInput {
  eventCode: string
  enabled?: boolean
  mandatory?: boolean
  requiredPermissionsAny?: string[]
  dedupWindowSec?: number
}

export interface NotificationCompanyPolicyDTO {
  eventCode: string
  enabled: boolean
  mandatory: boolean
  requiredPermissionsAny: string[]
  dedupWindowSec: number
  updatedBy?: string
  updatedByName?: string
  createdAt: string
  updatedAt: string
}

export interface NotificationMembershipPreferenceInput {
  eventCode: string
  enabled: boolean
}

export interface NotificationMembershipPreferenceDTO {
  eventCode: string
  enabled: boolean
  updatedBy?: string
  updatedByName?: string
  createdAt: string
  updatedAt: string
}

export interface NotificationCreateInput {
  empresaId: string
  userId: string
  eventCode: string
  module: string
  title: string
  message: string
  type?: string
  entityType?: string
  entityId?: string
  priority?: string
  severity?: string
  link?: string
  source?: string
  dedupKey?: string
  isMandatory?: boolean
  metadata?: Record<string, unknown>
  createdById?: string
  createdByName?: string
}
