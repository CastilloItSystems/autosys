import prisma from '../../services/prisma.service.js'
import { logger } from '../../shared/utils/logger.js'
import { domainEventBus } from '../../shared/events/domain-event-bus.js'
import { DomainEvent } from '../../shared/events/domain-events.js'
import notificationOrchestratorService from './notifications.orchestrator.js'
import { resolveNotificationEventCode } from './notifications.catalog.js'

let unsubscribe: (() => void) | null = null

const toNotificationInput = (event: DomainEvent) => ({
  empresaId: event.empresaId,
  eventCode: resolveNotificationEventCode(event.eventCode),
  module: event.module,
  title: event.title,
  message: event.message,
  type: event.type,
  entityType: event.entityType,
  entityId: event.entityId,
  priority: event.priority,
  severity: event.severity,
  link: event.link,
  source: event.source ?? 'domain_event_bus',
  dedupKey: event.dedupKey,
  metadata: event.metadata,
  createdById: event.createdById,
  createdByName: event.createdByName,
})

export const registerNotificationsBridge = (): void => {
  if (unsubscribe) return

  unsubscribe = domainEventBus.subscribe(async (event) => {
    try {
      await notificationOrchestratorService.emitEvent(
        toNotificationInput(event),
        prisma
      )
    } catch (error) {
      logger.error('Notifications bridge failed to dispatch domain event', {
        eventCode: event.eventCode,
        empresaId: event.empresaId,
        error,
      })
    }
  })

  logger.info('Notifications bridge initialized')
}

export const unregisterNotificationsBridge = (): void => {
  if (!unsubscribe) return
  unsubscribe()
  unsubscribe = null
}
