// backend/src/features/inventory/exitNotes/items/items.validation.ts

import Joi from 'joi'

export const recordPickingSchema = Joi.object({
  location: Joi.string().max(200).required().messages({
    'any.required': 'La ubicación de picking es requerida',
    'string.max': 'La ubicación no puede superar 200 caracteres',
  }),
  notes: Joi.string().max(500).optional(),
}).unknown(false)

export const verifyItemSchema = Joi.object({
  quantityVerified: Joi.number().integer().min(0).required().messages({
    'any.required': 'La cantidad verificada es requerida',
    'number.min': 'La cantidad verificada no puede ser negativa',
  }),
  notes: Joi.string().max(500).optional(),
}).unknown(false)

export const rejectItemSchema = Joi.object({
  reason: Joi.string().min(5).max(500).required().messages({
    'any.required': 'La razón de rechazo es requerida',
    'string.min': 'La razón debe tener al menos 5 caracteres',
  }),
}).unknown(false)

export const assignBatchSchema = Joi.object({
  batchId: Joi.string().uuid().required().messages({
    'any.required': 'El batchId es requerido',
    'string.guid': 'El batchId debe ser un UUID válido',
  }),
}).unknown(false)

export const assignSerialSchema = Joi.object({
  serialNumberId: Joi.string().uuid().required().messages({
    'any.required': 'El serialNumberId es requerido',
    'string.guid': 'El serialNumberId debe ser un UUID válido',
  }),
}).unknown(false)
