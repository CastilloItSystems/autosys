// backend/src/features/workshop/serviceOrderAdditionals/serviceOrderAdditionals.validation.ts

import Joi from 'joi'

export const createServiceOrderAdditionalSchema = Joi.object({
  description: Joi.string()
    .required()
    .messages({ 'any.required': 'La descripción es requerida' }),
  estimatedPrice: Joi.number().min(0).required().messages({
    'number.min': 'El precio estimado no puede ser negativo',
  }),
  status: Joi.string()
    .valid('PROPOSED', 'QUOTED', 'APPROVED', 'EXECUTED', 'REJECTED')
    .optional(),
  serviceOrderId: Joi.string()
    .required()
    .messages({ 'any.required': 'El ID de la orden es requerido' }),
})

export const updateServiceOrderAdditionalSchema = Joi.object({
  description: Joi.string().optional(),
  estimatedPrice: Joi.number().min(0).optional(),
  status: Joi.string()
    .valid('PROPOSED', 'QUOTED', 'APPROVED', 'EXECUTED', 'REJECTED')
    .optional(),
  serviceOrderId: Joi.string().optional(),
}).min(1)

export const additionalFiltersSchema = Joi.object({
  status: Joi.string()
    .valid('PROPOSED', 'QUOTED', 'APPROVED', 'EXECUTED', 'REJECTED')
    .optional(),
  serviceOrderId: Joi.string().optional(),
  search: Joi.string().optional(),
  page: Joi.number().integer().positive().optional(),
  limit: Joi.number().integer().positive().optional(),
})

export const createAdditionalItemSchema = Joi.object({
  type: Joi.string().valid('LABOR', 'PART', 'OTHER').optional(),
  description: Joi.string().trim().required().messages({ 'any.required': 'La descripción es requerida' }),
  referenceId: Joi.string().optional().allow('', null),
  quantity: Joi.number().min(0.01).precision(2).optional(),
  unitPrice: Joi.number().min(0).precision(2).optional(),
  unitCost: Joi.number().min(0).precision(2).optional(),
})

export const updateAdditionalItemSchema = Joi.object({
  description: Joi.string().trim().optional(),
  quantity: Joi.number().min(0.01).precision(2).optional(),
  unitPrice: Joi.number().min(0).precision(2).optional(),
  unitCost: Joi.number().min(0).precision(2).optional(),
  clientApproved: Joi.boolean().optional().allow(null),
}).min(1)
