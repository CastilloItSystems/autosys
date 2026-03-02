// backend/src/features/inventory/serialNumbers/serialNumbers.validation.ts

import Joi from 'joi'

export const createSerialNumberSchema = Joi.object({
  serialNumber: Joi.string().max(255).required().messages({
    'string.max': 'serialNumber no puede exceder 255 caracteres',
    'any.required': 'serialNumber es requerido',
  }),
  itemId: Joi.string().uuid().required().messages({
    'string.guid': 'itemId debe ser un UUID válido',
    'any.required': 'itemId es requerido',
  }),
  warehouseId: Joi.string().uuid().allow(null).optional(),
  status: Joi.string()
    .valid('IN_STOCK', 'SOLD', 'DEFECTIVE', 'WARRANTY', 'LOANED')
    .optional(),
  notes: Joi.string().allow(null).optional(),
})

export const updateSerialNumberSchema = Joi.object({
  status: Joi.string()
    .valid('IN_STOCK', 'SOLD', 'DEFECTIVE', 'WARRANTY', 'LOANED')
    .optional(),
  warehouseId: Joi.string().uuid().allow(null).optional(),
  notes: Joi.string().allow(null).optional(),
}).min(1)

export const assignSerialSchema = Joi.object({
  warehouseId: Joi.string().uuid().required().messages({
    'string.guid': 'warehouseId debe ser un UUID válido',
    'any.required': 'warehouseId es requerido',
  }),
})

export const serialFiltersSchema = Joi.object({
  itemId: Joi.string().uuid().optional(),
  serialNumber: Joi.string().optional(),
  warehouseId: Joi.string().uuid().optional(),
  status: Joi.string()
    .valid('IN_STOCK', 'SOLD', 'DEFECTIVE', 'WARRANTY', 'LOANED')
    .optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).optional(),
})

export const serialIdSchema = Joi.object({
  serialId: Joi.string().uuid().required().messages({
    'string.guid': 'serialId debe ser un UUID válido',
    'any.required': 'serialId es requerido',
  }),
})
