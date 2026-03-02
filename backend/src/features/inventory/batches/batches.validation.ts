// backend/src/features/inventory/batches/batches.validation.ts

import Joi from 'joi'

export const createBatchSchema = Joi.object({
  batchNumber: Joi.string().max(100).required().messages({
    'string.max': 'batchNumber no puede exceder 100 caracteres',
    'any.required': 'batchNumber es requerido',
  }),
  itemId: Joi.string().uuid().required().messages({
    'string.guid': 'itemId debe ser un UUID válido',
    'any.required': 'itemId es requerido',
  }),
  manufacturingDate: Joi.date().iso().allow(null).optional(),
  expiryDate: Joi.date().iso().allow(null).optional(),
  initialQuantity: Joi.number().integer().positive().required().messages({
    'number.base': 'initialQuantity debe ser un número',
    'number.positive': 'initialQuantity debe ser positivo',
    'any.required': 'initialQuantity es requerido',
  }),
  notes: Joi.string().allow(null).optional(),
})

export const updateBatchSchema = Joi.object({
  currentQuantity: Joi.number().integer().min(0).optional(),
  notes: Joi.string().allow(null).optional(),
  isActive: Joi.boolean().optional(),
}).min(1)

export const batchFiltersSchema = Joi.object({
  itemId: Joi.string().uuid().optional(),
  batchNumber: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
  expiryDateFrom: Joi.date().iso().optional(),
  expiryDateTo: Joi.date().iso().optional(),
  status: Joi.string()
    .valid('ACTIVE', 'EXPIRED', 'EXPIRING_SOON', 'INACTIVE')
    .optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).optional(),
})

export const batchIdSchema = Joi.object({
  batchId: Joi.string().uuid().required().messages({
    'string.guid': 'batchId debe ser un UUID válido',
    'any.required': 'batchId es requerido',
  }),
})
