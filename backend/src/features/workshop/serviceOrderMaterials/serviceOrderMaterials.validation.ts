// backend/src/features/workshop/serviceOrderMaterials/serviceOrderMaterials.validation.ts

import Joi from 'joi'

export const createServiceOrderMaterialSchema = Joi.object({
  description: Joi.string()
    .required()
    .messages({ 'any.required': 'La descripción es requerida' }),
  quantityRequested: Joi.number().positive().required().messages({
    'number.positive': 'La cantidad debe ser mayor a 0',
    'any.required': 'La cantidad es requerida',
  }),
  quantityReserved: Joi.number().min(0).optional(),
  quantityDispatched: Joi.number().min(0).optional(),
  quantityConsumed: Joi.number().min(0).optional(),
  quantityReturned: Joi.number().min(0).optional(),
  unitPrice: Joi.number().min(0).required().messages({
    'number.min': 'El precio unitario no puede ser negativo',
  }),
  unitCost: Joi.number().min(0).optional(),
  status: Joi.string()
    .valid(
      'REQUESTED',
      'RESERVED',
      'DISPATCHED',
      'CONSUMED',
      'RETURNED',
      'CANCELLED'
    )
    .optional(),
  serviceOrderId: Joi.string()
    .required()
    .messages({ 'any.required': 'El ID de la orden es requerido' }),
  itemId: Joi.string().optional(),
})

export const updateServiceOrderMaterialSchema = Joi.object({
  description: Joi.string().optional(),
  quantityRequested: Joi.number().positive().optional(),
  quantityReserved: Joi.number().min(0).optional(),
  quantityDispatched: Joi.number().min(0).optional(),
  quantityConsumed: Joi.number().min(0).optional(),
  quantityReturned: Joi.number().min(0).optional(),
  unitPrice: Joi.number().min(0).optional(),
  unitCost: Joi.number().min(0).optional(),
  status: Joi.string()
    .valid(
      'REQUESTED',
      'RESERVED',
      'DISPATCHED',
      'CONSUMED',
      'RETURNED',
      'CANCELLED'
    )
    .optional(),
  serviceOrderId: Joi.string().optional(),
  itemId: Joi.string().optional(),
}).min(1)

export const changeStatusSchema = Joi.object({
  status: Joi.string()
    .valid(
      'REQUESTED',
      'RESERVED',
      'DISPATCHED',
      'CONSUMED',
      'RETURNED',
      'CANCELLED'
    )
    .required()
    .messages({ 'any.required': 'El estado es requerido' }),
  // Requerido para transiciones que tocan inventario (RESERVED, DISPATCHED, RETURNED, CANCELLED)
  warehouseId: Joi.string().optional(),
  // Cantidad a retornar (solo para RETURNED)
  quantityReturned: Joi.number().positive().optional(),
})

export const materialFiltersSchema = Joi.object({
  status: Joi.string()
    .valid(
      'REQUESTED',
      'RESERVED',
      'DISPATCHED',
      'CONSUMED',
      'RETURNED',
      'CANCELLED'
    )
    .optional(),
  serviceOrderId: Joi.string().optional(),
  search: Joi.string().optional(),
  page: Joi.number().integer().positive().optional(),
  limit: Joi.number().integer().positive().optional(),
})
