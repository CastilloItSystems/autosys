// backend/src/features/workshop/serviceOrders/serviceOrders.validation.ts
import Joi from 'joi'

const VALID_ITEM_TYPES = ['LABOR', 'PART', 'OTHER']
const VALID_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'ASAP']
const VALID_TAX_TYPES = ['IVA', 'EXEMPT', 'REDUCED']

const itemSchema = Joi.object({
  type: Joi.string()
    .valid(...VALID_ITEM_TYPES)
    .default('LABOR')
    .messages({
      'any.only': `El tipo debe ser uno de: ${VALID_ITEM_TYPES.join(', ')}`,
    }),
  description: Joi.string().trim().max(500).required().messages({
    'string.empty': 'La descripción del item es requerida',
    'string.max': 'La descripción no puede exceder 500 caracteres',
    'any.required': 'La descripción del item es obligatoria',
  }),
  quantity: Joi.number().positive().default(1).messages({
    'number.positive': 'La cantidad debe ser mayor a 0',
    'number.base': 'La cantidad debe ser un número válido',
  }),
  unitPrice: Joi.number().min(0).precision(2).default(0).messages({
    'number.min': 'El precio unitario no puede ser negativo',
    'number.base': 'El precio unitario debe ser un número válido',
  }),
  unitCost: Joi.number().min(0).precision(2).default(0).messages({
    'number.min': 'El costo unitario no puede ser negativo',
    'number.base': 'El costo unitario debe ser un número válido',
  }),
  discountPct: Joi.number().min(0).max(100).default(0).messages({
    'number.min': 'El descuento no puede ser menor a 0%',
    'number.max': 'El descuento no puede exceder 100%',
    'number.base': 'El descuento debe ser un número válido',
  }),
  taxType: Joi.string()
    .valid(...VALID_TAX_TYPES)
    .default('IVA')
    .messages({
      'any.only': `El tipo de impuesto debe ser uno de: ${VALID_TAX_TYPES.join(', ')}`,
    }),
  taxRate: Joi.number().min(0).max(1).precision(4).default(0.16).messages({
    'number.min': 'La tasa de impuesto no puede ser negativa',
    'number.max': 'La tasa de impuesto no puede exceder 100% (1.0)',
    'number.base': 'La tasa de impuesto debe ser un número válido',
  }),
  itemId: Joi.string().optional().messages({
    'string.guid': 'ID de item inválido',
  }),
  operationId: Joi.string().optional().messages({
    'string.guid': 'ID de operación inválido',
  }),
  technicianId: Joi.string().optional().messages({
    'string.guid': 'ID de técnico inválido',
  }),
  notes: Joi.string().trim().max(1000).optional().messages({
    'string.max': 'Las notas del item no pueden exceder 1000 caracteres',
  }),
})

export const createServiceOrderSchema = Joi.object({
  customerId: Joi.string().trim().required().messages({
    'string.empty': 'El ID del cliente es requerido',
    'any.required': 'El cliente es obligatorio',
  }),
  priority: Joi.string()
    .valid(...VALID_PRIORITIES)
    .default('NORMAL')
    .messages({
      'any.only': `La prioridad debe ser: ${VALID_PRIORITIES.join(', ')}`,
    }),
  serviceTypeId: Joi.string().trim().optional().allow(null, '').messages({
    'string.guid': 'ID de tipo de servicio inválido',
  }),
  bayId: Joi.string().trim().optional().allow(null, '').messages({
    'string.guid': 'ID de bahía inválido',
  }),
  customerVehicleId: Joi.string().trim().optional().messages({
    'string.guid': 'ID de vehículo inválido',
  }),
  receptionId: Joi.string().trim().optional().messages({
    'string.guid': 'ID de recepción inválido',
  }),
  vehiclePlate: Joi.string().trim().max(20).optional().messages({
    'string.max': 'La placa del vehículo no puede exceder 20 caracteres',
  }),
  vehicleDesc: Joi.string().trim().max(255).optional().messages({
    'string.max': 'La descripción del vehículo no puede exceder 255 caracteres',
  }),
  mileageIn: Joi.number().integer().min(0).optional().messages({
    'number.min': 'El kilometraje de entrada no puede ser negativo',
    'number.base': 'El kilometraje debe ser un número entero',
  }),
  diagnosisNotes: Joi.string().trim().optional().messages({
    'string.base': 'Las notas de diagnóstico deben ser texto',
  }),
  observations: Joi.string().trim().optional().messages({
    'string.base': 'Las observaciones deben ser texto',
  }),
  assignedTechnicianId: Joi.string().trim().optional().messages({
    'string.guid': 'ID de técnico inválido',
  }),
  estimatedDelivery: Joi.alternatives()
    .try(Joi.date().iso(), Joi.string().trim())
    .optional()
    .messages({
      'date.base':
        'La fecha de entrega debe ser un formato ISO válido (ej: 2026-04-08T14:19)',
      'string.base': 'La fecha de entrega debe ser un string ISO válido',
    }),
  items: Joi.array().items(itemSchema).default([]).messages({
    'array.base': 'Los items deben ser un array',
    'array.includesRequiredUnknowns': 'Uno o más items tienen campos inválidos',
  }),
})

export const updateServiceOrderSchema = Joi.object({
  customerId: Joi.string().trim().optional().messages({
    'string.base': 'El ID del cliente debe ser un string válido',
  }),
  priority: Joi.string()
    .valid(...VALID_PRIORITIES)
    .optional()
    .messages({
      'any.only': `La prioridad debe ser: ${VALID_PRIORITIES.join(', ')}`,
    }),
  serviceTypeId: Joi.string().trim().optional().allow(null, '').messages({
    'string.guid': 'ID de tipo de servicio inválido',
  }),
  bayId: Joi.string().trim().optional().allow(null, '').messages({
    'string.guid': 'ID de bahía inválido',
  }),
  customerVehicleId: Joi.string().trim().optional().messages({
    'string.guid': 'ID de vehículo inválido',
  }),
  vehiclePlate: Joi.string().trim().max(20).optional().messages({
    'string.max': 'La placa del vehículo no puede exceder 20 caracteres',
  }),
  vehicleDesc: Joi.string().trim().max(255).optional().messages({
    'string.max': 'La descripción del vehículo no puede exceder 255 caracteres',
  }),
  mileageIn: Joi.number().integer().min(0).optional().messages({
    'number.min': 'El kilometraje de entrada no puede ser negativo',
    'number.base': 'El kilometraje debe ser un número entero',
  }),
  mileageOut: Joi.number().integer().min(0).optional().messages({
    'number.min': 'El kilometraje de salida no puede ser negativo',
    'number.base': 'El kilometraje debe ser un número entero',
  }),
  diagnosisNotes: Joi.string().trim().allow('').optional().messages({
    'string.base': 'Las notas de diagnóstico deben ser texto',
  }),
  observations: Joi.string().trim().allow('').optional().messages({
    'string.base': 'Las observaciones deben ser texto',
  }),
  assignedTechnicianId: Joi.string().trim().optional().allow(null).messages({
    'string.guid': 'ID de técnico inválido',
  }),
  estimatedDelivery: Joi.alternatives()
    .try(Joi.date().iso(), Joi.string().trim())
    .optional()
    .allow(null)
    .messages({
      'date.base': 'La fecha de entrega debe ser un formato ISO válido',
      'string.base': 'La fecha de entrega debe ser un string ISO válido',
    }),
  items: Joi.array().items(itemSchema).optional().messages({
    'array.base': 'Los items deben ser un array',
  }),
})

const SO_STATUSES = [
  'DRAFT',
  'OPEN',
  'DIAGNOSING',
  'PENDING_APPROVAL',
  'APPROVED',
  'IN_PROGRESS',
  'PAUSED',
  'WAITING_PARTS',
  'WAITING_AUTH',
  'QUALITY_CHECK',
  'READY',
  'DELIVERED',
  'INVOICED',
  'CLOSED',
  'CANCELLED',
]

export const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...SO_STATUSES)
    .required()
    .messages({
      'any.only': `El estado debe ser uno de: ${SO_STATUSES.join(', ')}`,
      'string.empty': 'El estado es requerido',
      'any.required': 'El estado es obligatorio',
    }),
  mileageOut: Joi.number().integer().min(0).optional().messages({
    'number.min': 'El kilometraje de salida no puede ser negativo',
    'number.base': 'El kilometraje debe ser un número entero',
  }),
})

export const consolidatedPreInvoiceSchema = Joi.object({
  serviceOrderIds: Joi.array()
    .items(Joi.string().trim())
    .min(2)
    .required()
    .messages({
      'array.min':
        'Se requieren al menos 2 órdenes para facturación consolidada',
      'array.base': 'Los IDs de órdenes deben ser un array',
      'any.required': 'Los IDs de órdenes son requeridos',
    }),
})

export const stalledFiltersSchema = Joi.object({
  waitingPartsDays: Joi.number().integer().min(1).default(3).messages({
    'number.min': 'Los días en espera de partes deben ser al menos 1',
    'number.base': 'Debe ser un número entero',
  }),
  pausedDays: Joi.number().integer().min(1).default(2).messages({
    'number.min': 'Los días pausados deben ser al menos 1',
    'number.base': 'Debe ser un número entero',
  }),
  waitingAuthDays: Joi.number().integer().min(1).default(1).messages({
    'number.min': 'Los días en espera de autorización deben ser al menos 1',
    'number.base': 'Debe ser un número entero',
  }),
})

export const serviceOrderFiltersSchema = Joi.object({
  status: Joi.string()
    .valid(...SO_STATUSES)
    .optional()
    .messages({
      'any.only': `El estado debe ser uno de: ${SO_STATUSES.join(', ')}`,
    }),
  customerId: Joi.string().trim().optional().messages({
    'string.base': 'El ID del cliente debe ser válido',
  }),
  assignedTechnicianId: Joi.string().trim().optional().messages({
    'string.base': 'El ID del técnico debe ser válido',
  }),
  search: Joi.string().trim().optional().messages({
    'string.base': 'El búsqueda debe ser texto',
  }),
  dateFrom: Joi.date().iso().optional().messages({
    'date.format': 'Fecha inválida. Usa formato ISO (ej: 2026-04-08T00:00:00Z)',
  }),
  dateTo: Joi.date().iso().optional().messages({
    'date.format': 'Fecha inválida. Usa formato ISO (ej: 2026-04-08T23:59:59Z)',
  }),
  page: Joi.number().integer().min(1).default(1).messages({
    'number.min': 'El número de página debe ser al menos 1',
    'number.base': 'El número de página debe ser entero',
  }),
  limit: Joi.number().integer().min(1).max(100).default(20).messages({
    'number.min': 'El límite debe ser al menos 1',
    'number.max': 'El límite no puede exceder 100 registros',
    'number.base': 'El límite debe ser un número entero',
  }),
  sortBy: Joi.string()
    .valid('folio', 'receivedAt', 'status', 'total', 'createdAt')
    .default('receivedAt')
    .messages({
      'any.only':
        'Debe ordenar por: folio, receivedAt, status, total o createdAt',
    }),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc').messages({
    'any.only': 'El orden debe ser "asc" (ascendente) o "desc" (descendente)',
  }),
})
