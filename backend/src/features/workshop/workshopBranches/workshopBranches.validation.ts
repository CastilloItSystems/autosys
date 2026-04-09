// backend/src/features/workshop/workshopBranches/workshopBranches.validation.ts
import Joi from 'joi'

export const createBranchSchema = Joi.object({
  code: Joi.string().trim().uppercase().min(2).max(20).required().messages({
    'string.empty': 'El código es requerido',
    'any.required': 'El código es requerido',
  }),
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'El nombre es requerido',
    'any.required': 'El nombre es requerido',
  }),
  address: Joi.string().trim().max(300).optional().allow('', null),
  phone: Joi.string().trim().max(50).optional().allow('', null),
  managerUserId: Joi.string().trim().optional().allow('', null),
})

export const updateBranchSchema = Joi.object({
  code: Joi.string().trim().uppercase().min(2).max(20).optional(),
  name: Joi.string().trim().min(2).max(100).optional(),
  address: Joi.string().trim().max(300).optional().allow('', null),
  phone: Joi.string().trim().max(50).optional().allow('', null),
  managerUserId: Joi.string().trim().optional().allow('', null),
  isActive: Joi.boolean().optional(),
}).min(1).messages({ 'object.min': 'Debe proporcionar al menos un campo para actualizar' })

export const branchFiltersSchema = Joi.object({
  search: Joi.string().trim().optional().allow(''),
  isActive: Joi.boolean().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
})
