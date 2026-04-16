// backend/src/features/sales/preInvoices/preInvoices.validation.ts

import Joi from 'joi'

export const preInvoiceFiltersSchema = Joi.object({
  status: Joi.string()
    .valid(
      'PENDING_PREPARATION',
      'IN_PREPARATION',
      'READY_FOR_PAYMENT',
      'PAID',
      'CANCELLED'
    )
    .optional(),
  customerId: Joi.string().uuid().optional(),
  orderId: Joi.string().uuid().optional(),
  serviceOrderId: Joi.string().optional(),
  hasServiceOrder: Joi.boolean().optional(),
  origin: Joi.string().valid('ORDER', 'WORKSHOP').optional(),
  search: Joi.string().max(200).optional().allow(''),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string()
    .valid('createdAt', 'preInvoiceNumber', 'status', 'total')
    .default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
})

export const updatePreInvoiceSchema = Joi.object({
  notes: Joi.string().max(1000).optional().allow(null, ''),
  preparedBy: Joi.string().optional().allow(null, ''),
})
