// backend/src/features/workshop/workshopReworks/workshopReworks.validation.ts
import Joi from 'joi'

export const createReworkSchema = Joi.object({
  originalOrderId: Joi.string().required().messages({ 'any.required': 'El ID de la orden original es requerido' }),
  motive: Joi.string().trim().min(5).required().messages({
    'string.empty': 'El motivo es requerido',
    'any.required': 'El motivo es requerido',
  }),
  rootCause: Joi.string().trim().optional().allow('', null),
  technicianId: Joi.string().trim().optional().allow('', null),
  estimatedCost: Joi.number().min(0).precision(2).optional(),
  notes: Joi.string().trim().optional().allow('', null),
})

export const updateReworkSchema = Joi.object({
  rootCause: Joi.string().trim().optional().allow('', null),
  technicianId: Joi.string().trim().optional().allow('', null),
  estimatedCost: Joi.number().min(0).precision(2).optional(),
  realCost: Joi.number().min(0).precision(2).optional(),
  notes: Joi.string().trim().optional().allow('', null),
  reworkOrderId: Joi.string().trim().optional().allow('', null),
}).min(1).messages({ 'object.min': 'Debe proporcionar al menos un campo para actualizar' })

export const changeReworkStatusSchema = Joi.object({
  status: Joi.string().valid('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED').required().messages({
    'any.required': 'El estado es requerido',
    'any.only': 'Estado inválido',
  }),
})

export const reworkFiltersSchema = Joi.object({
  status: Joi.string().valid('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED').optional(),
  technicianId: Joi.string().optional(),
  originalOrderId: Joi.string().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
})
