// backend/src/features/sales/payments/payments.validation.ts

import Joi from 'joi'

const paymentDetailSchema = Joi.object({
  method: Joi.string()
    .valid('CASH', 'TRANSFER', 'CARD', 'MOBILE_PAYMENT', 'CHECK', 'CREDIT')
    .required(),
  amount: Joi.number().positive().required(),
  reference: Joi.string().max(100).optional().allow(null, ''),
  currency: Joi.string().valid('USD', 'VES', 'EUR').optional(),
})

export const createPaymentSchema = Joi.object({
  preInvoiceId: Joi.string().uuid().required().messages({
    'any.required': 'preInvoiceId es requerido',
  }),
  method: Joi.string()
    .valid('CASH', 'TRANSFER', 'CARD', 'MOBILE_PAYMENT', 'CHECK', 'CREDIT', 'MIXED')
    .required()
    .messages({ 'any.required': 'El método de pago es requerido' }),
  amount: Joi.number().positive().required().messages({
    'any.required': 'El monto es requerido',
    'number.positive': 'El monto debe ser positivo',
  }),
  currency: Joi.string().valid('USD', 'VES', 'EUR').optional().default('USD'),
  exchangeRate: Joi.number().positive().optional().allow(null),
  igtfApplies: Joi.boolean().optional().default(false),
  details: Joi.when('method', {
    is: 'MIXED',
    then: Joi.array().items(paymentDetailSchema).min(2).required().messages({
      'array.min': 'Pago mixto requiere al menos 2 métodos',
    }),
    otherwise: Joi.array().items(paymentDetailSchema).optional(),
  }),
  reference: Joi.string().max(100).optional().allow(null, ''),
  notes: Joi.string().max(500).optional().allow(null, ''),
})

export const paymentFiltersSchema = Joi.object({
  status: Joi.string()
    .valid('PENDING', 'COMPLETED', 'CANCELLED', 'REFUNDED')
    .optional(),
  method: Joi.string()
    .valid('CASH', 'TRANSFER', 'CARD', 'MOBILE_PAYMENT', 'CHECK', 'CREDIT', 'MIXED')
    .optional(),
  customerId: Joi.string().uuid().optional(),
  preInvoiceId: Joi.string().uuid().optional(),
  search: Joi.string().max(200).optional().allow(''),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string()
    .valid('createdAt', 'paymentNumber', 'status', 'amount', 'processedAt')
    .default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
})
