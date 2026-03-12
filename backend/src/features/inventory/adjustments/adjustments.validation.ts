// backend/src/features/inventory/adjustments/adjustments.validation.ts

import Joi from 'joi'
import { AdjustmentStatus } from './adjustments.interface.js'

export const createAdjustmentSchema = Joi.object({
  warehouseId: Joi.string().uuid().required().messages({
    'string.guid': 'warehouseId debe ser un UUID válido',
    'any.required': 'warehouseId es requerido',
  }),
  reason: Joi.string().max(255).required().messages({
    'string.max': 'reason no puede exceder 255 caracteres',
    'any.required': 'reason es requerido',
  }),
  notes: Joi.string().allow(null, '').optional(),
  items: Joi.array()
    .items(
      Joi.object({
        itemId: Joi.string().uuid().required().messages({
          'string.guid': 'itemId debe ser un UUID válido',
          'any.required': 'itemId es requerido',
        }),
        quantityChange: Joi.number().integer().not(0).required().messages({
          'any.required': 'quantityChange es requerido',
          'number.base': 'quantityChange debe ser un número',
        }),
        unitCost: Joi.number().positive().allow(null).optional(),
        notes: Joi.string().allow(null, '').optional(),
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'El ajuste debe tener al menos un ítem',
      'any.required': 'items es requerido',
    }),
}).unknown(false)

export const updateAdjustmentSchema = Joi.object({
  reason: Joi.string().max(255).optional(),
  notes: Joi.string().allow(null, '').optional(),
})
  .min(1)
  .unknown(false)

export const rejectAdjustmentSchema = Joi.object({
  reason: Joi.string().min(3).max(500).required().messages({
    'any.required': 'La razón de rechazo es requerida',
    'string.min': 'La razón debe tener al menos 3 caracteres',
  }),
}).unknown(false)

export const addAdjustmentItemSchema = Joi.object({
  itemId: Joi.string().uuid().required().messages({
    'string.guid': 'itemId debe ser un UUID válido',
    'any.required': 'itemId es requerido',
  }),
  quantityChange: Joi.number().integer().not(0).required().messages({
    'any.required': 'quantityChange es requerido',
  }),
  unitCost: Joi.number().positive().allow(null).optional(),
  notes: Joi.string().allow(null, '').optional(),
}).unknown(false)

export const adjustmentFiltersSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(500).optional(),
  warehouseId: Joi.string().uuid().optional(),
  status: Joi.string()
    .valid(...Object.values(AdjustmentStatus))
    .optional(),
  reason: Joi.string().max(255).optional(),
  createdFrom: Joi.date().iso().optional(),
  createdTo: Joi.date().iso().optional(),
  approvedFrom: Joi.date().iso().optional(),
  approvedTo: Joi.date().iso().optional(),
  sortBy: Joi.string()
    .valid('createdAt', 'updatedAt', 'adjustmentNumber', 'status', 'appliedAt')
    .optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional(),
}).unknown(false)
