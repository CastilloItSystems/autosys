// backend/src/features/workshop/workshopWarranties/workshopWarranties.validation.ts
import Joi from 'joi'

const WARRANTY_TYPES = ['LABOR', 'PARTS', 'MIXED', 'COMMERCIAL']
const WARRANTY_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CLOSED']

export const createWarrantySchema = Joi.object({
  type: Joi.string().valid(...WARRANTY_TYPES).required().messages({
    'any.required': 'El tipo de garantía es requerido',
    'any.only': `El tipo debe ser uno de: ${WARRANTY_TYPES.join(', ')}`,
  }),
  originalOrderId: Joi.string().required().messages({ 'any.required': 'La orden de trabajo original es requerida' }),
  customerId: Joi.string().required().messages({ 'any.required': 'El cliente es requerido' }),
  customerVehicleId: Joi.string().optional(),
  description: Joi.string().trim().min(10).max(2000).required().messages({
    'string.min': 'La descripción debe tener al menos 10 caracteres',
    'any.required': 'La descripción es requerida',
  }),
  technicianId: Joi.string().optional(),
  expiresAt: Joi.date().iso().optional(),
})

export const updateWarrantySchema = Joi.object({
  rootCause: Joi.string().trim().max(1000).optional(),
  resolution: Joi.string().trim().max(2000).optional(),
  technicianId: Joi.string().optional().allow(null),
  reworkOrderId: Joi.string().optional().allow(null),
}).min(1).messages({ 'object.min': 'Debe proporcionar al menos un campo para actualizar' })

export const updateWarrantyStatusSchema = Joi.object({
  status: Joi.string().valid(...WARRANTY_STATUSES).required().messages({
    'any.required': 'El estado es requerido',
    'any.only': `El estado debe ser uno de: ${WARRANTY_STATUSES.join(', ')}`,
  }),
})

export const warrantyFiltersSchema = Joi.object({
  status: Joi.string().valid(...WARRANTY_STATUSES).optional(),
  type: Joi.string().valid(...WARRANTY_TYPES).optional(),
  customerId: Joi.string().optional(),
  technicianId: Joi.string().optional(),
  search: Joi.string().trim().optional().allow(''),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid('warrantyNumber', 'createdAt', 'expiresAt').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
})
