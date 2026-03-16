/**
 * Event Types and Interfaces for Inventory System
 * Central definition of all events that can be emitted across the inventory module
 */

export enum EventType {
  // Stock Events
  STOCK_CREATED = 'stock.created',
  STOCK_UPDATED = 'stock.updated',
  STOCK_RESERVED = 'stock.reserved',
  STOCK_UNRESERVED = 'stock.unreserved',
  STOCK_MOVEMENT_CREATED = 'stock.movement.created',
  STOCK_LOW = 'stock.low',

  // Adjustment Events
  ADJUSTMENT_CREATED = 'adjustment.created',
  ADJUSTMENT_APPROVED = 'adjustment.approved',
  ADJUSTMENT_APPLIED = 'adjustment.applied',
  ADJUSTMENT_REJECTED = 'adjustment.rejected',
  ADJUSTMENT_CANCELLED = 'adjustment.cancelled',

  // Cycle Count Events
  CYCLE_COUNT_CREATED = 'cycleCount.created',
  CYCLE_COUNT_APPROVED = 'cycleCount.approved',
  CYCLE_COUNT_APPLIED = 'cycleCount.applied',
  CYCLE_COUNT_REJECTED = 'cycleCount.rejected',
  CYCLE_COUNT_COMPLETED = 'cycleCount.completed',

  // Reconciliation Events
  RECONCILIATION_CREATED = 'reconciliation.created',
  RECONCILIATION_APPROVED = 'reconciliation.approved',
  RECONCILIATION_APPLIED = 'reconciliation.applied',
  RECONCILIATION_REJECTED = 'reconciliation.rejected',

  // Loan Events (Phase 5.1)
  LOAN_CREATED = 'loan.created',
  LOAN_APPROVED = 'loan.approved',
  LOAN_ACTIVE = 'loan.active',
  LOAN_RETURNED = 'loan.returned',
  LOAN_OVERDUE = 'loan.overdue',

  // External Repair Events (Phase 5.3)
  EXTERNAL_REPAIR_CREATED = 'externalRepair.created',
  EXTERNAL_REPAIR_SENT = 'externalRepair.sent',
  EXTERNAL_REPAIR_RECEIVED = 'externalRepair.received',
  EXTERNAL_REPAIR_QUALITY_CHECK = 'externalRepair.qualityCheck',
  EXTERNAL_REPAIR_REJECTED = 'externalRepair.rejected',

  // Return Events (Phase 5.4)
  RETURN_CREATED = 'return.created',
  RETURN_APPROVED = 'return.approved',
  RETURN_PROCESSED = 'return.processed',
  RETURN_REJECTED = 'return.rejected',

  // Transfer Events (Phase 5.5)
  TRANSFER_CREATED = 'transfer.created',
  TRANSFER_SUBMITTED = 'transfer.submitted',
  TRANSFER_APPROVED = 'transfer.approved',
  TRANSFER_REJECTED = 'transfer.rejected',
  TRANSFER_SENT = 'transfer.sent',
  TRANSFER_RECEIVED = 'transfer.received',
  TRANSFER_CANCELLED = 'transfer.cancelled',

  // Serial Number Events (Phase 5.2)
  SERIAL_CREATED = 'serialNumber.created',
  SERIAL_ASSIGNED_LOCATION = 'serialNumber.assignedLocation',
  SERIAL_STATUS_CHANGED = 'serialNumber.statusChanged',

  // Item Events
  ITEM_CREATED = 'item.created',
  ITEM_UPDATED = 'item.updated',
  ITEM_DELETED = 'item.deleted',

  // Reservation Events
  RESERVATION_CREATED = 'reservation.created',
  RESERVATION_CONFIRMED = 'reservation.confirmed',
  RESERVATION_FULFILLED = 'reservation.fulfilled',
  RESERVATION_CANCELLED = 'reservation.cancelled',
  RESERVATION_EXPIRED = 'reservation.expired',

  // Pre-Invoice Events
  PRE_INVOICE_CREATED = 'preInvoice.created',
  PRE_INVOICE_CANCELLED = 'preInvoice.cancelled',

  // Sales Order Events
  SALES_ORDER_CREATED = 'salesOrder.created',
  SALES_ORDER_SHIPPED = 'salesOrder.shipped',
  SALES_ORDER_CANCELLED = 'salesOrder.cancelled',

  // Batch Events (Phase 5.7)
  BATCH_CREATED = 'batch.created',
  BATCH_EXPIRING_SOON = 'batch.expiringSoon',
  BATCH_EXPIRED = 'batch.expired',

  // System Events
  SYSTEM_ALERT = 'system.alert',
  SYSTEM_WARNING = 'system.warning',
  SYSTEM_ERROR = 'system.error',

  // Inventory Analytics Events
  INVENTORY_METRICS_CALCULATED = 'inventory.metricsCalculated',
  FORECAST_CALCULATED = 'forecast.calculated',
  STOCK_LEVELS_UPDATED = 'stock.levelsUpdated',
  STOCK_DISCREPANCY_DETECTED = 'stock.discrepancyDetected',
  STOCK_INTEGRITY_ISSUE = 'stock.integrityIssue',
  LOW_STOCK_ALERT = 'stock.lowAlert',
  CRITICAL_STOCK_ALERT = 'stock.criticalAlert',

  // Movement Events
  MOVEMENT_AUDIT_CREATED = 'movement.auditCreated',
  MOVEMENT_METRICS_RECORDED = 'movement.metricsRecorded',

  // Workshop Events
  MATERIAL_CONSUMED = 'workshop.materialConsumed',
  WORK_ORDER_COMPLETED = 'workshop.workOrderCompleted',

  // Sales Integration Events
  PRE_INVOICE_LINKED = 'preInvoice.linked',
  SHIPMENT_CONFIRMED = 'sales.shipmentConfirmed',

  // Return Item Events
  RETURN_ITEM_ADDED = 'return.itemAdded',
  RETURN_ITEM_PROCESSED = 'return.itemProcessed',
}

export enum EventPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface IEvent {
  id: string
  type: EventType
  entityId: string
  entityType: string // 'stock', 'adjustment', 'loan', etc.
  userId: string
  data: Record<string, any>
  priority: EventPriority
  createdAt: Date
}

export interface IEventPayload {
  type: EventType
  entityId: string
  entityType: string
  userId?: string
  data: Record<string, any>
  priority?: EventPriority
}

export interface IEventListener {
  id: string
  eventType: EventType | EventType[]
  handler: (event: IEvent) => Promise<void> | void
  priority?: number // For execution order
}

export interface ISocketEventPayload {
  channel: string
  event: EventType
  data: any
  timestamp: Date
}

export interface IEventContext {
  parentEventId?: string
  source: string // 'api', 'job', 'hook', 'webhook'
  metadata?: Record<string, any>
}
