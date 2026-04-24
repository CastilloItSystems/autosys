import prisma from '../../../../services/prisma.service.js'
import { logger } from '../../../../shared/utils/logger.js'
import { domainEventBus } from '../../../../shared/events/domain-event-bus.js'
import { toDomainEvent } from '../../../../shared/events/domain-events.js'
import EventService from './event.service.js'
import { EventPriority, EventType, IEvent } from './event.types.js'
import SocketService from './socket.service.js'

let bridgeInitialized = false

const ALERT_EVENT_TYPES: EventType[] = [
  EventType.STOCK_LOW,
  EventType.LOW_STOCK_ALERT,
  EventType.CRITICAL_STOCK_ALERT,
  EventType.SYSTEM_WARNING,
  EventType.SYSTEM_ERROR,
]

const LEGACY_NOTIFICATION_EVENT_TYPES: EventType[] = [
  EventType.LOAN_CREATED,
  EventType.LOAN_APPROVED,
  EventType.LOAN_ACTIVE,
  EventType.LOAN_RETURNED,
  EventType.LOAN_OVERDUE,
  EventType.CYCLE_COUNT_CREATED,
  EventType.CYCLE_COUNT_COMPLETED,
  EventType.CYCLE_COUNT_APPROVED,
  EventType.CYCLE_COUNT_APPLIED,
  EventType.CYCLE_COUNT_REJECTED,
  EventType.RECONCILIATION_CREATED,
  EventType.RECONCILIATION_APPROVED,
  EventType.RECONCILIATION_APPLIED,
  EventType.RECONCILIATION_REJECTED,
  EventType.RETURN_CREATED,
  EventType.RETURN_APPROVED,
  EventType.RETURN_PROCESSED,
  EventType.RETURN_REJECTED,
  EventType.SERIAL_CREATED,
  EventType.SERIAL_STATUS_CHANGED,
  EventType.SERIAL_ASSIGNED_LOCATION,
]

const STOCK_UPDATE_EVENT_TYPES: EventType[] = [
  EventType.STOCK_UPDATED,
  EventType.STOCK_LEVELS_UPDATED,
]

const mapPriority = (
  value: EventPriority
): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' => {
  const normalized = String(value).trim().toUpperCase()
  if (normalized === 'LOW') return 'LOW'
  if (normalized === 'HIGH') return 'HIGH'
  if (normalized === 'CRITICAL') return 'CRITICAL'
  return 'MEDIUM'
}

const resolveSeverity = (event: IEvent): 'INFO' | 'WARNING' | 'ERROR' => {
  if (event.type === EventType.LOAN_OVERDUE) return 'WARNING'
  if (
    event.type === EventType.CYCLE_COUNT_REJECTED ||
    event.type === EventType.RECONCILIATION_REJECTED ||
    event.type === EventType.RETURN_REJECTED
  ) {
    return 'WARNING'
  }
  if (event.type === EventType.SYSTEM_ERROR) return 'ERROR'
  if (event.type === EventType.CRITICAL_STOCK_ALERT) return 'ERROR'
  if (event.type === EventType.SYSTEM_WARNING) return 'WARNING'
  if (event.type === EventType.LOW_STOCK_ALERT) return 'WARNING'
  if (event.type === EventType.STOCK_LOW) return 'WARNING'
  return 'INFO'
}

const resolveNotificationType = (
  event: IEvent
): 'info' | 'warning' | 'error' | 'success' => {
  if (
    event.type === EventType.LOAN_APPROVED ||
    event.type === EventType.LOAN_ACTIVE ||
    event.type === EventType.LOAN_RETURNED ||
    event.type === EventType.CYCLE_COUNT_APPROVED ||
    event.type === EventType.CYCLE_COUNT_APPLIED ||
    event.type === EventType.RECONCILIATION_APPROVED ||
    event.type === EventType.RECONCILIATION_APPLIED ||
    event.type === EventType.RETURN_APPROVED ||
    event.type === EventType.RETURN_PROCESSED
  ) {
    return 'success'
  }

  const severity = resolveSeverity(event)
  if (severity === 'ERROR') return 'error'
  if (severity === 'WARNING') return 'warning'
  return 'info'
}

const resolveNotificationTitle = (event: IEvent): string => {
  if (event.type === EventType.LOAN_CREATED) return 'Préstamo creado'
  if (event.type === EventType.LOAN_APPROVED) return 'Préstamo aprobado'
  if (event.type === EventType.LOAN_ACTIVE) return 'Préstamo activado'
  if (event.type === EventType.LOAN_RETURNED) return 'Préstamo retornado'
  if (event.type === EventType.LOAN_OVERDUE) return 'Préstamo vencido'
  if (event.type === EventType.CYCLE_COUNT_CREATED) return 'Conteo cíclico creado'
  if (event.type === EventType.CYCLE_COUNT_COMPLETED) return 'Conteo cíclico completado'
  if (event.type === EventType.CYCLE_COUNT_APPROVED) return 'Conteo cíclico aprobado'
  if (event.type === EventType.CYCLE_COUNT_APPLIED) return 'Conteo cíclico aplicado'
  if (event.type === EventType.CYCLE_COUNT_REJECTED) return 'Conteo cíclico rechazado'
  if (event.type === EventType.RECONCILIATION_CREATED) return 'Reconciliación creada'
  if (event.type === EventType.RECONCILIATION_APPROVED) return 'Reconciliación aprobada'
  if (event.type === EventType.RECONCILIATION_APPLIED) return 'Reconciliación aplicada'
  if (event.type === EventType.RECONCILIATION_REJECTED) return 'Reconciliación rechazada'
  if (event.type === EventType.RETURN_CREATED) return 'Devolución creada'
  if (event.type === EventType.RETURN_APPROVED) return 'Devolución aprobada'
  if (event.type === EventType.RETURN_PROCESSED) return 'Devolución procesada'
  if (event.type === EventType.RETURN_REJECTED) return 'Devolución rechazada'
  if (event.type === EventType.SERIAL_CREATED) return 'Serial creado'
  if (event.type === EventType.SERIAL_STATUS_CHANGED) return 'Estado de serial actualizado'
  if (event.type === EventType.SERIAL_ASSIGNED_LOCATION) return 'Serial asignado a ubicación'
  if (event.type === EventType.CRITICAL_STOCK_ALERT) return 'Stock crítico detectado'
  if (event.type === EventType.LOW_STOCK_ALERT || event.type === EventType.STOCK_LOW) {
    return 'Alerta de stock bajo'
  }
  if (event.type === EventType.SYSTEM_WARNING) return 'Advertencia del sistema'
  if (event.type === EventType.SYSTEM_ERROR) return 'Error del sistema'
  return 'Alerta de inventario'
}

const resolveNotificationMessage = (event: IEvent): string => {
  const data = (event.data ?? {}) as Record<string, unknown>
  if (typeof data.message === 'string' && data.message.trim()) {
    return data.message.trim()
  }

  if (Array.isArray(data.alerts) && data.alerts.length > 0) {
    const firstAlert = data.alerts.find(
      (alert) =>
        alert &&
        typeof alert === 'object' &&
        typeof (alert as Record<string, unknown>).message === 'string' &&
        (alert as Record<string, unknown>).message
    ) as Record<string, unknown> | undefined

    if (typeof firstAlert?.message === 'string' && firstAlert.message.trim()) {
      return firstAlert.message.trim()
    }
  }

  return `Se detectó el evento ${event.type} para ${event.entityType} ${event.entityId}`
}

const getWarehouseIdFromEvent = (event: IEvent): string | undefined => {
  const data = (event.data ?? {}) as Record<string, unknown>

  if (typeof data.warehouseId === 'string' && data.warehouseId) {
    return data.warehouseId
  }

  if (typeof data.warehouseFromId === 'string' && data.warehouseFromId) {
    return data.warehouseFromId
  }

  if (typeof data.warehouseToId === 'string' && data.warehouseToId) {
    return data.warehouseToId
  }

  const alerts = Array.isArray(data.alerts) ? data.alerts : []
  const firstAlertWithWarehouse = alerts.find(
    (alert) =>
      alert &&
      typeof alert === 'object' &&
      typeof (alert as Record<string, unknown>).warehouseId === 'string'
  ) as Record<string, unknown> | undefined

  if (
    typeof firstAlertWithWarehouse?.warehouseId === 'string' &&
    firstAlertWithWarehouse.warehouseId
  ) {
    return firstAlertWithWarehouse.warehouseId
  }

  if (event.entityType?.toUpperCase() === 'WAREHOUSE') {
    return event.entityId
  }

  return undefined
}

const resolveEmpresaIdFromWarehouse = async (
  warehouseId: string
): Promise<string | undefined> => {
  if (!warehouseId) return undefined
  const warehouse = await prisma.warehouse.findUnique({
    where: { id: warehouseId },
    select: { empresaId: true },
  })
  return warehouse?.empresaId
}

const normalizeEntityType = (value: string | undefined): string =>
  (value ?? '').trim().toLowerCase().replace(/[\s_-]/g, '')

const resolveEmpresaIdFromEntity = async (
  event: IEvent
): Promise<string | undefined> => {
  const normalizedEntityType = normalizeEntityType(event.entityType)

  if (normalizedEntityType === 'warehouse') {
    return resolveEmpresaIdFromWarehouse(event.entityId)
  }

  if (normalizedEntityType === 'loan') {
    const entity = await prisma.loan.findUnique({
      where: { id: event.entityId },
      select: { warehouseId: true },
    })
    return entity?.warehouseId
      ? await resolveEmpresaIdFromWarehouse(entity.warehouseId)
      : undefined
  }

  if (normalizedEntityType === 'cyclecount') {
    const entity = await prisma.cycleCount.findUnique({
      where: { id: event.entityId },
      select: { warehouseId: true },
    })
    return entity?.warehouseId
      ? await resolveEmpresaIdFromWarehouse(entity.warehouseId)
      : undefined
  }

  if (normalizedEntityType === 'reconciliation') {
    const entity = await prisma.reconciliation.findUnique({
      where: { id: event.entityId },
      select: { warehouseId: true },
    })
    return entity?.warehouseId
      ? await resolveEmpresaIdFromWarehouse(entity.warehouseId)
      : undefined
  }

  if (normalizedEntityType === 'return') {
    const entity = await prisma.returnOrder.findUnique({
      where: { id: event.entityId },
      select: { warehouseId: true },
    })
    return entity?.warehouseId
      ? await resolveEmpresaIdFromWarehouse(entity.warehouseId)
      : undefined
  }

  if (normalizedEntityType === 'serialnumber') {
    const entity = await prisma.serialNumber.findUnique({
      where: { id: event.entityId },
      select: { warehouseId: true, itemId: true },
    })

    if (entity?.warehouseId) {
      return resolveEmpresaIdFromWarehouse(entity.warehouseId)
    }

    if (entity?.itemId) {
      const item = await prisma.item.findUnique({
        where: { id: entity.itemId },
        select: { empresaId: true },
      })
      return item?.empresaId
    }
  }

  return undefined
}

const resolveEmpresaId = async (event: IEvent): Promise<string | undefined> => {
  const data = (event.data ?? {}) as Record<string, unknown>

  if (typeof data.empresaId === 'string' && data.empresaId) {
    return data.empresaId
  }

  const warehouseId = getWarehouseIdFromEvent(event)
  if (warehouseId) {
    const empresaIdFromWarehouse =
      await resolveEmpresaIdFromWarehouse(warehouseId)
    if (empresaIdFromWarehouse) return empresaIdFromWarehouse
  }

  return resolveEmpresaIdFromEntity(event)
}

const buildBasePayload = (event: IEvent, empresaId: string) => ({
  ...event.data,
  empresaId,
  eventId: event.id,
  eventType: event.type,
  entityId: event.entityId,
  entityType: event.entityType,
  timestamp: new Date().toISOString(),
})

const resolvePriority = (
  event: IEvent
): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' => {
  if (
    event.type === EventType.SYSTEM_ERROR ||
    event.type === EventType.CRITICAL_STOCK_ALERT
  ) {
    return 'CRITICAL'
  }

  if (
    event.type === EventType.LOAN_OVERDUE ||
    event.type === EventType.CYCLE_COUNT_REJECTED ||
    event.type === EventType.RECONCILIATION_REJECTED ||
    event.type === EventType.RETURN_REJECTED
  ) {
    return 'HIGH'
  }

  return mapPriority(event.priority)
}

const resolveCanonicalEventCode = (event: IEvent): string => {
  if (event.type === EventType.CRITICAL_STOCK_ALERT) {
    return 'inventory.stock.critical'
  }
  if (event.type === EventType.SYSTEM_WARNING) {
    return 'system.warning'
  }
  if (event.type === EventType.SYSTEM_ERROR) {
    return 'system.error'
  }
  if (event.type === EventType.STOCK_LOW || event.type === EventType.LOW_STOCK_ALERT) {
    return 'inventory.stock.low'
  }

  if (event.type === EventType.LOAN_CREATED) return 'inventory.loan.created'
  if (event.type === EventType.LOAN_APPROVED) return 'inventory.loan.approved'
  if (event.type === EventType.LOAN_ACTIVE) return 'inventory.loan.active'
  if (event.type === EventType.LOAN_RETURNED) return 'inventory.loan.returned'
  if (event.type === EventType.LOAN_OVERDUE) return 'inventory.loan.overdue'

  if (event.type === EventType.CYCLE_COUNT_CREATED) {
    return 'inventory.cycle_count.created'
  }
  if (event.type === EventType.CYCLE_COUNT_COMPLETED) {
    return 'inventory.cycle_count.completed'
  }
  if (event.type === EventType.CYCLE_COUNT_APPROVED) {
    return 'inventory.cycle_count.approved'
  }
  if (event.type === EventType.CYCLE_COUNT_APPLIED) {
    return 'inventory.cycle_count.applied'
  }
  if (event.type === EventType.CYCLE_COUNT_REJECTED) {
    return 'inventory.cycle_count.rejected'
  }

  if (event.type === EventType.RECONCILIATION_CREATED) {
    return 'inventory.reconciliation.created'
  }
  if (event.type === EventType.RECONCILIATION_APPROVED) {
    return 'inventory.reconciliation.approved'
  }
  if (event.type === EventType.RECONCILIATION_APPLIED) {
    return 'inventory.reconciliation.applied'
  }
  if (event.type === EventType.RECONCILIATION_REJECTED) {
    return 'inventory.reconciliation.rejected'
  }

  if (event.type === EventType.RETURN_CREATED) return 'inventory.return.created'
  if (event.type === EventType.RETURN_APPROVED) return 'inventory.return.approved'
  if (event.type === EventType.RETURN_PROCESSED) return 'inventory.return.processed'
  if (event.type === EventType.RETURN_REJECTED) return 'inventory.return.rejected'

  if (event.type === EventType.SERIAL_CREATED) {
    return 'inventory.serial_number.created'
  }
  if (event.type === EventType.SERIAL_STATUS_CHANGED) {
    return 'inventory.serial_number.status_changed'
  }
  if (event.type === EventType.SERIAL_ASSIGNED_LOCATION) {
    return 'inventory.serial_number.assigned_location'
  }

  return 'inventory.stock.low'
}

const toCanonicalDomainEvent = (event: IEvent, empresaId: string) => {
  const severity = resolveSeverity(event)
  const priority = resolvePriority(event)
  const eventCode = resolveCanonicalEventCode(event)
  const isSystem = eventCode.startsWith('system.')

  return toDomainEvent({
    empresaId,
    eventCode,
    module: isSystem ? 'system' : 'inventory',
    title: resolveNotificationTitle(event),
    message: resolveNotificationMessage(event),
    type: resolveNotificationType(event),
    entityType: event.entityType,
    entityId: event.entityId,
    priority,
    severity,
    source: 'inventory.event_service',
    dedupKey: `${eventCode}:${event.entityType}:${event.entityId}`,
    metadata: {
      ...(event.data as Record<string, unknown>),
      legacyEventType: event.type,
      legacyEventId: event.id,
    },
    createdById: event.userId || 'SYSTEM',
    createdByName: 'Sistema',
  })
}

const publishAlertDomainEvent = async (
  event: IEvent,
  empresaId: string
): Promise<void> => {
  await domainEventBus.publish(toCanonicalDomainEvent(event, empresaId))
}

export const registerInventoryRealtimeBridge = (): void => {
  if (bridgeInitialized) return

  const eventService = EventService.getInstance()

  eventService.on(ALERT_EVENT_TYPES, async (event) => {
    const io = SocketService.getInstance().getIO()
    if (!io) return

    const empresaId = await resolveEmpresaId(event)
    if (!empresaId) {
      logger.debug('Inventory realtime bridge: evento sin empresa resoluble', {
        eventType: event.type,
        eventId: event.id,
      })
      return
    }

    io.to(`empresa-${empresaId}`).emit(
      'inventory:alert',
      buildBasePayload(event, empresaId)
    )

    try {
      await publishAlertDomainEvent(event, empresaId)
    } catch (error) {
      logger.error('Inventory realtime bridge: error publicando domain event', {
        eventType: event.type,
        eventId: event.id,
        empresaId,
        error,
      })
    }
  })

  eventService.on(LEGACY_NOTIFICATION_EVENT_TYPES, async (event) => {
    const empresaId = await resolveEmpresaId(event)
    if (!empresaId) {
      logger.debug('Inventory realtime bridge: evento legacy sin empresa resoluble', {
        eventType: event.type,
        eventId: event.id,
      })
      return
    }

    try {
      await publishAlertDomainEvent(event, empresaId)
    } catch (error) {
      logger.error('Inventory realtime bridge: error publicando domain event legacy', {
        eventType: event.type,
        eventId: event.id,
        empresaId,
        error,
      })
    }
  })

  eventService.on(STOCK_UPDATE_EVENT_TYPES, async (event) => {
    const io = SocketService.getInstance().getIO()
    if (!io) return

    const empresaId = await resolveEmpresaId(event)
    if (!empresaId) return

    io.to(`empresa-${empresaId}`).emit(
      'inventory:stock-updated',
      buildBasePayload(event, empresaId)
    )
  })

  bridgeInitialized = true
  logger.info('Inventory realtime bridge inicializado')
}
