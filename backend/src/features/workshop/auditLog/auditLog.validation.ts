// backend/src/features/workshop/auditLog/auditLog.validation.ts
import Joi from 'joi'

const ENTITY_TYPES = [
  'SERVICE_ORDER', 'VEHICLE_RECEPTION', 'SERVICE_APPOINTMENT',
  'WORKSHOP_WARRANTY', 'WORKSHOP_REWORK', 'QUALITY_CHECK',
  'LABOR_TIME', 'SERVICE_ORDER_MATERIAL', 'VEHICLE_DELIVERY',
]

const ACTIONS = [
  'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE',
  'REOPEN', 'APPROVE', 'REJECT', 'CANCEL', 'ASSIGN', 'DELIVER',
]

export const auditLogFiltersSchema = Joi.object({
  entityType: Joi.string().valid(...ENTITY_TYPES).optional(),
  entityId: Joi.string().optional(),
  action: Joi.string().valid(...ACTIONS).optional(),
  userId: Joi.string().optional(),
  dateFrom: Joi.string().isoDate().optional(),
  dateTo: Joi.string().isoDate().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(50),
})
