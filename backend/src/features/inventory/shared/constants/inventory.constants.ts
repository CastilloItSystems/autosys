// backend/src/features/inventory/shared/constants/inventory.constants.ts

export const WAREHOUSE_TYPES = {
  PRINCIPAL: 'PRINCIPAL',
  SUCURSAL: 'SUCURSAL',
  TRANSITO: 'TRANSITO',
} as const

export type WarehouseType =
  (typeof WAREHOUSE_TYPES)[keyof typeof WAREHOUSE_TYPES]

export const WAREHOUSE_TYPE_LABELS: Record<WarehouseType, string> = {
  PRINCIPAL: 'Principal',
  SUCURSAL: 'Sucursal',
  TRANSITO: 'Tránsito',
}

export const UNIT_TYPES = {
  COUNTABLE: 'COUNTABLE',
  WEIGHT: 'WEIGHT',
  VOLUME: 'VOLUME',
  LENGTH: 'LENGTH',
} as const

export type UnitType = (typeof UNIT_TYPES)[keyof typeof UNIT_TYPES]

export const UNIT_TYPE_LABELS: Record<UnitType, string> = {
  COUNTABLE: 'Contable',
  WEIGHT: 'Peso',
  VOLUME: 'Volumen',
  LENGTH: 'Longitud',
}

export const MOVEMENT_TYPES = {
  PURCHASE: 'PURCHASE',
  SALE: 'SALE',
  ADJUSTMENT_IN: 'ADJUSTMENT_IN',
  ADJUSTMENT_OUT: 'ADJUSTMENT_OUT',
  TRANSFER: 'TRANSFER',
  SUPPLIER_RETURN: 'SUPPLIER_RETURN',
  WORKSHOP_RETURN: 'WORKSHOP_RETURN',
  RESERVATION_RELEASE: 'RESERVATION_RELEASE',
} as const

export type MovementType = (typeof MOVEMENT_TYPES)[keyof typeof MOVEMENT_TYPES]

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  PURCHASE: 'Compra',
  SALE: 'Venta',
  ADJUSTMENT_IN: 'Ajuste Entrada',
  ADJUSTMENT_OUT: 'Ajuste Salida',
  TRANSFER: 'Transferencia',
  SUPPLIER_RETURN: 'Devolución a Proveedor',
  WORKSHOP_RETURN: 'Devolución de Taller',
  RESERVATION_RELEASE: 'Liberación de Reserva',
}

export const PURCHASE_ORDER_STATUS = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  PARTIAL: 'PARTIAL',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const

export type PurchaseOrderStatus =
  (typeof PURCHASE_ORDER_STATUS)[keyof typeof PURCHASE_ORDER_STATUS]

export const PURCHASE_ORDER_STATUS_LABELS: Record<PurchaseOrderStatus, string> =
  {
    DRAFT: 'Borrador',
    SENT: 'Enviada',
    PARTIAL: 'Parcial',
    COMPLETED: 'Completada',
    CANCELLED: 'Cancelada',
  }

export const RESERVATION_STATUS = {
  ACTIVE: 'ACTIVE',
  PENDING_PICKUP: 'PENDING_PICKUP',
  CONSUMED: 'CONSUMED',
  RELEASED: 'RELEASED',
} as const

export type ReservationStatus =
  (typeof RESERVATION_STATUS)[keyof typeof RESERVATION_STATUS]

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  ACTIVE: 'Activa',
  PENDING_PICKUP: 'Pendiente de Retiro',
  CONSUMED: 'Consumida',
  RELEASED: 'Liberada',
}

export const SERIAL_STATUS = {
  IN_STOCK: 'IN_STOCK',
  SOLD: 'SOLD',
  DEFECTIVE: 'DEFECTIVE',
  WARRANTY: 'WARRANTY',
  LOANED: 'LOANED',
} as const

export type SerialStatus = (typeof SERIAL_STATUS)[keyof typeof SERIAL_STATUS]

export const SERIAL_STATUS_LABELS: Record<SerialStatus, string> = {
  IN_STOCK: 'En Stock',
  SOLD: 'Vendido',
  DEFECTIVE: 'Defectuoso',
  WARRANTY: 'En Garantía',
  LOANED: 'Prestado',
}

export const EXIT_NOTE_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  READY: 'READY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const

export type ExitNoteStatus =
  (typeof EXIT_NOTE_STATUS)[keyof typeof EXIT_NOTE_STATUS]

export const EXIT_NOTE_STATUS_LABELS: Record<ExitNoteStatus, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En Preparación',
  READY: 'Lista',
  DELIVERED: 'Entregada',
  CANCELLED: 'Cancelada',
}

export const LOAN_STATUS = {
  ACTIVE: 'ACTIVE',
  RETURNED: 'RETURNED',
  OVERDUE: 'OVERDUE',
  LOST: 'LOST',
} as const

export type LoanStatus = (typeof LOAN_STATUS)[keyof typeof LOAN_STATUS]

export const LOAN_STATUS_LABELS: Record<LoanStatus, string> = {
  ACTIVE: 'Activo',
  RETURNED: 'Devuelto',
  OVERDUE: 'Vencido',
  LOST: 'Perdido',
}

export const STOCK_ALERT_TYPES = {
  LOW_STOCK: 'LOW_STOCK',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  EXPIRING_SOON: 'EXPIRING_SOON',
  EXPIRED: 'EXPIRED',
  OVERSTOCK: 'OVERSTOCK',
} as const

export type StockAlertType =
  (typeof STOCK_ALERT_TYPES)[keyof typeof STOCK_ALERT_TYPES]

export const STOCK_ALERT_TYPE_LABELS: Record<StockAlertType, string> = {
  LOW_STOCK: 'Stock Bajo',
  OUT_OF_STOCK: 'Sin Stock',
  EXPIRING_SOON: 'Próximo a Vencer',
  EXPIRED: 'Vencido',
  OVERSTOCK: 'Exceso de Stock',
}

export const LOCATION_PATTERN = /^[A-Z]\d+-[A-Z]\d+-[A-Z]\d+$/
// Ejemplo: M1-R01-D03

export const SKU_PATTERN = /^[A-Z0-9-]+$/
// Ejemplo: FIL-001, ACE-10W40-001

export const STOCK_THRESHOLDS = {
  LOW_STOCK_MULTIPLIER: 1.5, // 1.5 veces el mínimo
  CRITICAL_STOCK_MULTIPLIER: 1.0, // Igual al mínimo
  EXPIRING_SOON_DAYS: 30, // 30 días antes del vencimiento
  EXPIRED_BUFFER_DAYS: 0, // Sin buffer para vencidos
}

export const COST_METHODS = {
  FIFO: 'FIFO', // First In, First Out
  LIFO: 'LIFO', // Last In, First Out
  AVERAGE: 'AVERAGE', // Promedio Ponderado
} as const

export type CostMethod = (typeof COST_METHODS)[keyof typeof COST_METHODS]
