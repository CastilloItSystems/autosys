// backend/src/features/crm/activities/activities.interface.ts

export enum ActivityType {
  CALL = 'CALL',
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
  MEETING = 'MEETING',
  QUOTE = 'QUOTE',
  TASK = 'TASK',
}

export enum ActivityStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

export interface IActivity {
  id: string
  empresaId: string
  customerId: string
  leadId?: string | null
  type: ActivityType
  status: ActivityStatus
  title: string
  description?: string | null
  assignedTo: string
  dueAt: Date
  completedAt?: Date | null
  completedBy?: string | null
  outcome?: string | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface IActivityFilters {
  customerId?: string
  leadId?: string
  assignedTo?: string
  status?: string
  type?: string
  dueBefore?: string
  dueAfter?: string
}
