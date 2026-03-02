// backend/src/features/inventory/receives/receives.validation.ts

import Joi from 'joi'

export const createReceiveSchema = Joi.object({
  purchaseOrderId: Joi.string()
    .uuid({ version: 'uuidv4', separator: '-' })
    .required()
    .messages({
      'string.guid': 'purchaseOrderId debe ser un UUID válido',
      'any.required': 'purchaseOrderId es requerido',
    }),
  warehouseId: Joi.string()
    .uuid({ version: 'uuidv4', separator: '-' })
    .required()
    .messages({
      'string.guid': 'warehouseId debe ser un UUID válido',
      'any.required': 'warehouseId es requerido',
    }),
  notes: Joi.string().max(2000).optional(),
  receivedBy: Joi.string().optional(),
})

export const updateReceiveSchema = Joi.object({
  notes: Joi.string().max(2000).allow(null).optional(),
  receivedBy: Joi.string().allow(null).optional(),
}).min(1)

export const addReceiveItemSchema = Joi.object({
  itemId: Joi.string()
    .uuid({ version: 'uuidv4', separator: '-' })
    .required()
    .messages({
      'string.guid': 'itemId debe ser un UUID válido',
      'any.required': 'itemId es requerido',
    }),
  quantityReceived: Joi.number().integer().positive().required().messages({
    'number.positive': 'quantityReceived debe ser mayor a 0',
    'number.integer': 'quantityReceived debe ser un número entero',
    'any.required': 'quantityReceived es requerido',
  }),
  unitCost: Joi.number().positive().required().messages({
    'number.positive': 'unitCost debe ser mayor a 0',
    'any.required': 'unitCost es requerido',
  }),
  batchNumber: Joi.string().optional(),
  expiryDate: Joi.date().iso().optional(),
})
