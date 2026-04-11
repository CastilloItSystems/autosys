// backend/src/features/workshop/serviceTypes/serviceTypes.validation.ts
import Joi from 'joi'

export const createServiceTypeSchema = Joi.object({
  code: Joi.string().trim().uppercase().min(2).max(20).required().messages({
    'string.empty': 'El código es requerido',
    'any.required': 'El código es requerido',
  }),
  name: Joi.string().trim().min(3).max(100).required().messages({
    'string.empty': 'El nombre es requerido',
    'any.required': 'El nombre es requerido',
  }),
  description: Joi.string().trim().max(500).optional().allow(''),
})

export const updateServiceTypeSchema = Joi.object({
  code: Joi.string().trim().uppercase().min(2).max(20).optional(),
  name: Joi.string().trim().min(3).max(100).optional(),
  description: Joi.string().trim().max(500).optional().allow('', null),
}).min(1).messages({ 'object.min': 'Debe proporcionar al menos un campo para actualizar' })

export const serviceTypeFiltersSchema = Joi.object({
  search: Joi.string().trim().optional().allow(''),
  isActive: Joi.boolean().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid('code', 'name', 'createdAt').default('name'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
})
