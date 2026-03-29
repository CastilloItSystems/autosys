// backend/src/features/workshop/serviceOrders/serviceOrders.validation.ts
import Joi from 'joi'

const itemSchema = Joi.object({
  type: Joi.string().valid('LABOR', 'PART', 'OTHER').default('LABOR'),
  description: Joi.string().trim().max(500).required(),
  quantity: Joi.number().positive().default(1),
  unitPrice: Joi.number().min(0).default(0),
})

export const createServiceOrderSchema = Joi.object({
  customerId: Joi.string().required(),
  customerVehicleId: Joi.string().optional(),
  vehiclePlate: Joi.string().trim().max(20).optional(),
  vehicleDesc: Joi.string().trim().max(255).optional(),
  mileageIn: Joi.number().integer().min(0).optional(),
  diagnosisNotes: Joi.string().trim().optional(),
  observations: Joi.string().trim().optional(),
  assignedTechnicianId: Joi.string().optional(),
  estimatedDelivery: Joi.date().iso().optional(),
  items: Joi.array().items(itemSchema).default([]),
})

export const updateServiceOrderSchema = Joi.object({
  customerVehicleId: Joi.string().optional(),
  vehiclePlate: Joi.string().trim().max(20).optional(),
  vehicleDesc: Joi.string().trim().max(255).optional(),
  mileageIn: Joi.number().integer().min(0).optional(),
  mileageOut: Joi.number().integer().min(0).optional(),
  diagnosisNotes: Joi.string().trim().allow('').optional(),
  observations: Joi.string().trim().allow('').optional(),
  assignedTechnicianId: Joi.string().optional().allow(null),
  estimatedDelivery: Joi.date().iso().optional().allow(null),
  items: Joi.array().items(itemSchema).optional(),
})

const SO_STATUSES = [
  'DRAFT', 'OPEN', 'DIAGNOSING', 'PENDING_APPROVAL', 'APPROVED',
  'IN_PROGRESS', 'PAUSED', 'WAITING_PARTS', 'WAITING_AUTH',
  'QUALITY_CHECK', 'READY', 'DELIVERED', 'INVOICED', 'CLOSED', 'CANCELLED',
]

export const updateStatusSchema = Joi.object({
  status: Joi.string().valid(...SO_STATUSES).required().messages({
    'any.only': `El estado debe ser uno de: ${SO_STATUSES.join(', ')}`,
    'any.required': 'El estado es requerido',
  }),
  mileageOut: Joi.number().integer().min(0).optional(),
})

export const serviceOrderFiltersSchema = Joi.object({
  status: Joi.string().valid(...SO_STATUSES).optional(),
  customerId: Joi.string().optional(),
  assignedTechnicianId: Joi.string().optional(),
  search: Joi.string().trim().optional(),
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string()
    .valid('folio', 'receivedAt', 'status', 'total', 'createdAt')
    .default('receivedAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
})
