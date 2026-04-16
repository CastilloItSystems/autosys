import Joi from 'joi'

export const createDealerQuoteSchema = Joi.object({
  dealerUnitId: Joi.string().required().messages({
    'any.required': 'La unidad es requerida',
  }),
  customerName: Joi.string().max(180).required().messages({
    'any.required': 'El nombre del cliente es requerido',
  }),
  customerDocument: Joi.string().max(60).optional().allow(null, ''),
  customerPhone: Joi.string().max(40).optional().allow(null, ''),
  customerEmail: Joi.string().email().max(180).optional().allow(null, ''),
  listPrice: Joi.number().min(0).optional().allow(null),
  discountPct: Joi.number().min(0).max(100).optional().allow(null),
  offeredPrice: Joi.number().min(0).optional().allow(null),
  taxPct: Joi.number().min(0).max(100).optional().allow(null),
  currency: Joi.string().max(8).optional().allow(null, ''),
  validUntil: Joi.date().iso().optional().allow(null),
  paymentTerms: Joi.string().optional().allow(null, ''),
  financingRequired: Joi.boolean().optional(),
  notes: Joi.string().optional().allow(null, ''),
  status: Joi.string().valid('DRAFT', 'SENT', 'NEGOTIATING', 'APPROVED', 'REJECTED', 'EXPIRED', 'CONVERTED').optional(),
})

export const updateDealerQuoteSchema = Joi.object({
  customerName: Joi.string().max(180).optional(),
  customerDocument: Joi.string().max(60).optional().allow(null, ''),
  customerPhone: Joi.string().max(40).optional().allow(null, ''),
  customerEmail: Joi.string().email().max(180).optional().allow(null, ''),
  listPrice: Joi.number().min(0).optional().allow(null),
  discountPct: Joi.number().min(0).max(100).optional().allow(null),
  offeredPrice: Joi.number().min(0).optional().allow(null),
  taxPct: Joi.number().min(0).max(100).optional().allow(null),
  currency: Joi.string().max(8).optional().allow(null, ''),
  validUntil: Joi.date().iso().optional().allow(null),
  paymentTerms: Joi.string().optional().allow(null, ''),
  financingRequired: Joi.boolean().optional(),
  notes: Joi.string().optional().allow(null, ''),
  status: Joi.string().valid('DRAFT', 'SENT', 'NEGOTIATING', 'APPROVED', 'REJECTED', 'EXPIRED', 'CONVERTED').optional(),
  isActive: Joi.boolean().optional(),
})

export const dealerQuoteFiltersSchema = Joi.object({
  dealerUnitId: Joi.string().optional().allow(''),
  status: Joi.string()
    .valid('DRAFT', 'SENT', 'NEGOTIATING', 'APPROVED', 'REJECTED', 'EXPIRED', 'CONVERTED')
    .optional()
    .allow(''),
  isActive: Joi.boolean().optional(),
  search: Joi.string().max(200).optional().allow(''),
  fromDate: Joi.date().iso().optional(),
  toDate: Joi.date().iso().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(20),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'status', 'totalAmount', 'validUntil').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
})
