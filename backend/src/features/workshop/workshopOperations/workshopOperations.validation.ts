// backend/src/features/workshop/workshopOperations/workshopOperations.validation.ts
import Joi from 'joi'

export const createWorkshopOperationSchema = Joi.object({
  code: Joi.string().trim().uppercase().min(2).max(20).required().messages({
    'string.empty': 'El código es requerido',
    'any.required': 'El código es requerido',
  }),
  name: Joi.string().trim().min(3).max(200).required().messages({
    'string.empty': 'El nombre es requerido',
    'any.required': 'El nombre es requerido',
  }),
  description: Joi.string().trim().max(500).optional().allow(''),
  serviceTypeId: Joi.string().optional(),
  standardMinutes: Joi.number().integer().min(1).optional(),
  listPrice: Joi.number().min(0).precision(2).default(0),
})

export const updateWorkshopOperationSchema = Joi.object({
  code: Joi.string().trim().uppercase().min(2).max(20).optional(),
  name: Joi.string().trim().min(3).max(200).optional(),
  description: Joi.string().trim().max(500).optional().allow('', null),
  serviceTypeId: Joi.string().optional().allow(null),
  standardMinutes: Joi.number().integer().min(1).optional().allow(null),
  listPrice: Joi.number().min(0).precision(2).optional(),
}).min(1).messages({ 'object.min': 'Debe proporcionar al menos un campo para actualizar' })

export const workshopOperationFiltersSchema = Joi.object({
  search: Joi.string().trim().optional().allow(''),
  serviceTypeId: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid('code', 'name', 'listPrice', 'createdAt').default('name'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
})
