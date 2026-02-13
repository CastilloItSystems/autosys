// backend/src/features/inventory/items/catalogs/model-compatibility/model-compatibility.validation.ts

import Joi from 'joi'

export const createCompatibilitySchema = Joi.object({
  partModelId: Joi.string()
    .uuid({ version: 'uuidv4', separator: '-' })
    .required()
    .messages({
      'string.guid': 'partModelId debe ser un UUID válido',
      'any.required': 'partModelId es requerido',
    }),
  vehicleModelId: Joi.string()
    .uuid({ version: 'uuidv4', separator: '-' })
    .required()
    .messages({
      'string.guid': 'vehicleModelId debe ser un UUID válido',
      'any.required': 'vehicleModelId es requerido',
    }),
  notes: Joi.string().max(500).optional().allow(null),
  isVerified: Joi.boolean().optional(),
})

export const updateCompatibilitySchema = Joi.object({
  notes: Joi.string().max(500).optional().allow(null),
  isVerified: Joi.boolean().optional(),
})

export const compatibilityIdSchema = Joi.object({
  id: Joi.string()
    .uuid({ version: 'uuidv4', separator: '-' })
    .required()
    .messages({
      'string.guid': 'El ID debe ser un UUID válido',
      'any.required': 'El ID es requerido',
    }),
})

export const modelIdSchema = Joi.object({
  partModelId: Joi.string()
    .uuid({ version: 'uuidv4', separator: '-' })
    .required()
    .messages({
      'string.guid': 'partModelId debe ser un UUID válido',
      'any.required': 'partModelId es requerido',
    }),
})

export const vehicleModelIdSchema = Joi.object({
  vehicleModelId: Joi.string()
    .uuid({ version: 'uuidv4', separator: '-' })
    .required()
    .messages({
      'string.guid': 'vehicleModelId debe ser un UUID válido',
      'any.required': 'vehicleModelId es requerido',
    }),
})

export const getCompatibilityFiltersSchema = Joi.object({
  partModelId: Joi.string()
    .uuid({ version: 'uuidv4', separator: '-' })
    .optional(),
  vehicleModelId: Joi.string()
    .uuid({ version: 'uuidv4', separator: '-' })
    .optional(),
  isVerified: Joi.boolean().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
})
