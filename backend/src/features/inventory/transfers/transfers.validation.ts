// backend/src/features/inventory/transfers/transfers.validation.ts

import Joi from 'joi'

export const createTransferSchema = Joi.object({
  fromWarehouseId: Joi.string().uuid().required().messages({
    'string.guid': 'fromWarehouseId debe ser un UUID válido',
    'any.required': 'fromWarehouseId es requerido',
  }),
  toWarehouseId: Joi.string().uuid().required().messages({
    'string.guid': 'toWarehouseId debe ser un UUID válido',
    'any.required': 'toWarehouseId es requerido',
  }),
  items: Joi.array()
    .items(
      Joi.object({
        itemId: Joi.string().uuid().required(),
        quantity: Joi.number().integer().positive().required(),
        unitCost: Joi.number().positive().allow(null).optional(),
        notes: Joi.string().allow(null).optional(),
      })
    )
    .min(1)
    .required(),
  notes: Joi.string().allow(null).optional(),
})

export const updateTransferSchema = Joi.object({
  notes: Joi.string().allow(null).optional(),
}).min(1)

export const sendTransferSchema = Joi.object({
  sentBy: Joi.string().required().messages({
    'any.required': 'sentBy es requerido',
  }),
})

export const receiveTransferSchema = Joi.object({
  receivedBy: Joi.string().required().messages({
    'any.required': 'receivedBy es requerido',
  }),
})

export const transferFiltersSchema = Joi.object({
  fromWarehouseId: Joi.string().uuid().optional(),
  toWarehouseId: Joi.string().uuid().optional(),
  status: Joi.string()
    .valid('DRAFT', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED')
    .optional(),
  createdFrom: Joi.date().iso().optional(),
  createdTo: Joi.date().iso().optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).optional(),
})

export const transferIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'id debe ser un UUID válido',
    'any.required': 'id es requerido',
  }),
})
