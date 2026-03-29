// backend/src/features/crm/quotes/quotes.validation.ts

import Joi from 'joi'

const quoteItemSchema = Joi.object({
  description: Joi.string().max(500).required().messages({
    'any.required': 'La descripción del ítem es requerida',
    'string.max': 'La descripción no puede exceder 500 caracteres',
  }),
  quantity: Joi.number().positive().required().messages({
    'any.required': 'La cantidad es requerida',
    'number.positive': 'La cantidad debe ser mayor a 0',
  }),
  unitPrice: Joi.number().min(0).required().messages({
    'any.required': 'El precio unitario es requerido',
    'number.min': 'El precio unitario no puede ser negativo',
  }),
  discountPct: Joi.number().min(0).max(100).default(0).messages({
    'number.min': 'El descuento no puede ser negativo',
    'number.max': 'El descuento no puede superar el 100%',
  }),
  taxPct: Joi.number().min(0).max(100).default(0).messages({
    'number.min': 'El impuesto no puede ser negativo',
    'number.max': 'El impuesto no puede superar el 100%',
  }),
  itemId: Joi.string().uuid().optional().allow(null, ''),
  notes: Joi.string().optional().allow(null, ''),
})

export const createQuoteSchema = Joi.object({
  title: Joi.string().max(255).required().messages({
    'any.required': 'El título es requerido',
    'string.max': 'El título no puede exceder 255 caracteres',
  }),
  type: Joi.string()
    .valid('VEHICLE', 'PARTS', 'SERVICE', 'CORPORATE')
    .required()
    .messages({
      'any.required': 'El tipo de cotización es requerido',
      'any.only': 'Tipo de cotización inválido. Valores válidos: VEHICLE, PARTS, SERVICE, CORPORATE',
    }),
  customerId: Joi.string().uuid().required().messages({
    'any.required': 'El cliente es requerido',
    'string.guid': 'El customerId debe ser un UUID válido',
  }),
  leadId: Joi.string().uuid().optional().allow(null, ''),
  description: Joi.string().optional().allow(null, ''),
  currency: Joi.string().max(10).default('USD'),
  discountPct: Joi.number().min(0).max(100).default(0).messages({
    'number.min': 'El descuento no puede ser negativo',
    'number.max': 'El descuento no puede superar el 100%',
  }),
  taxPct: Joi.number().min(0).max(100).default(0).messages({
    'number.min': 'El impuesto no puede ser negativo',
    'number.max': 'El impuesto no puede superar el 100%',
  }),
  validUntil: Joi.string().isoDate().optional().allow(null, ''),
  paymentTerms: Joi.string().optional().allow(null, ''),
  deliveryTerms: Joi.string().optional().allow(null, ''),
  notes: Joi.string().optional().allow(null, ''),
  assignedTo: Joi.string().optional().allow(null, ''),
  items: Joi.array().items(quoteItemSchema).optional().default([]),
})

export const updateQuoteSchema = Joi.object({
  title: Joi.string().max(255).optional(),
  description: Joi.string().optional().allow(null, ''),
  currency: Joi.string().max(10).optional(),
  discountPct: Joi.number().min(0).max(100).optional(),
  taxPct: Joi.number().min(0).max(100).optional(),
  validUntil: Joi.string().isoDate().optional().allow(null, ''),
  paymentTerms: Joi.string().optional().allow(null, ''),
  deliveryTerms: Joi.string().optional().allow(null, ''),
  notes: Joi.string().optional().allow(null, ''),
  assignedTo: Joi.string().optional().allow(null, ''),
  leadId: Joi.string().uuid().optional().allow(null, ''),
  items: Joi.array().items(quoteItemSchema).optional(),
})

export const updateQuoteStatusSchema = Joi.object({
  status: Joi.string()
    .valid('DRAFT', 'ISSUED', 'SENT', 'NEGOTIATING', 'APPROVED', 'REJECTED', 'EXPIRED', 'CONVERTED')
    .required()
    .messages({
      'any.required': 'El estado es requerido',
      'any.only': 'Estado de cotización inválido',
    }),
  notes: Joi.string().optional().allow(null, ''),
})

export const quoteFiltersSchema = Joi.object({
  type: Joi.string().valid('VEHICLE', 'PARTS', 'SERVICE', 'CORPORATE').optional(),
  status: Joi.string()
    .valid('DRAFT', 'ISSUED', 'SENT', 'NEGOTIATING', 'APPROVED', 'REJECTED', 'EXPIRED', 'CONVERTED')
    .optional(),
  customerId: Joi.string().uuid().optional().allow(''),
  leadId: Joi.string().uuid().optional().allow(''),
  assignedTo: Joi.string().optional().allow(''),
  search: Joi.string().optional().allow(''),
  dateFrom: Joi.string().isoDate().optional().allow(''),
  dateTo: Joi.string().isoDate().optional().allow(''),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(20),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'total', 'quoteNumber', 'status', 'validUntil').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
})
