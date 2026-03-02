// backend/src/features/inventory/adjustments/adjustments.validation.ts

import Joi from 'joi'
import { AdjustmentStatus } from './adjustments.interface'

export const createAdjustmentSchema = Joi.object({
  warehouseId: Joi.string().uuid().required().messages({
    'string.guid': 'warehouseId debe ser un UUID válido',
    'any.required': 'warehouseId es requerido',
  }),
  reason: Joi.string().max(255).required().messages({
    'string.max': 'reason no puede exceder 255 caracteres',
    'any.required': 'reason es requerido',
  }),
  notes: Joi.string().allow(null).optional(),
  items: Joi.array()
    .items(
      Joi.object({
        itemId: Joi.string().uuid().required(),
        quantityChange: Joi.number().integer().required(),
        unitCost: Joi.number().positive().allow(null).optional(),
        notes: Joi.string().allow(null).optional(),
      })
    )
    .min(1)
    .required(),
})

export const updateAdjustmentSchema = Joi.object({
  reason: Joi.string().max(255).optional(),
  notes: Joi.string().allow(null).optional(),
}).min(1)

export const approveAdjustmentSchema = Joi.object({
  approvedBy: Joi.string().required().messages({
    'any.required': 'approvedBy es requerido',
  }),
})

export const applyAdjustmentSchema = Joi.object({
  appliedBy: Joi.string().required().messages({
    'any.required': 'appliedBy es requerido',
  }),
})

export const addAdjustmentItemSchema = Joi.object({
  itemId: Joi.string().uuid().required().messages({
    'string.guid': 'itemId debe ser un UUID válido',
    'any.required': 'itemId es requerido',
  }),
  quantityChange: Joi.number().integer().required().messages({
    'any.required': 'quantityChange es requerido',
  }),
  unitCost: Joi.number().positive().allow(null).optional(),
  notes: Joi.string().allow(null).optional(),
})
