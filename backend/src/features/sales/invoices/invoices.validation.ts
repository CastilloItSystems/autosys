// backend/src/features/sales/invoices/invoices.validation.ts

import Joi from 'joi'

export const invoiceFiltersSchema = Joi.object({
  status: Joi.string().valid('ACTIVE', 'CANCELLED', 'CREDITED').optional(),
  customerId: Joi.string().uuid().optional(),
  preInvoiceId: Joi.string().uuid().optional(),
  search: Joi.string().max(200).optional().allow(''),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string()
    .valid('createdAt', 'invoiceNumber', 'fiscalNumber', 'status', 'total', 'invoiceDate')
    .default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
})

export const cancelInvoiceSchema = Joi.object({
  cancellationReason: Joi.string().max(500).required().messages({
    'any.required': 'El motivo de anulación es requerido',
  }),
})
