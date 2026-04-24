export type DomainEventPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type DomainEventSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS'

export type DomainEventModule =
  | 'inventory'
  | 'sales'
  | 'purchases'
  | 'workshop'
  | 'crm'
  | 'dealer'
  | 'exchange_rates'
  | 'system'
  | string

export interface DomainEvent {
  empresaId: string
  eventCode: string
  module: DomainEventModule
  occurredAt: Date
  title?: string
  message?: string
  type?: string
  entityType?: string
  entityId?: string
  priority?: DomainEventPriority
  severity?: DomainEventSeverity | string
  link?: string
  source?: string
  dedupKey?: string
  metadata?: Record<string, unknown>
  createdById?: string
  createdByName?: string
}

export interface DomainEventDraft
  extends Omit<DomainEvent, 'occurredAt'> {
  occurredAt?: Date
}

export const toDomainEvent = (draft: DomainEventDraft): DomainEvent => ({
  ...draft,
  occurredAt: draft.occurredAt ?? new Date(),
})
