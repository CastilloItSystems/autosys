import Joi from 'joi'

const accessorySchema = Joi.object({
  itemId: Joi.string().optional().allow(null, ''),
  name: Joi.string().max(180).required().messages({ 'any.required': 'El nombre del accesorio es requerido' }),
  type: Joi.string().valid('FACTURABLE', 'BONIFICADO', 'PROMOCIONAL').optional(),
  quantity: Joi.number().integer().min(1).optional(),
  unitPrice: Joi.number().min(0).optional(),
  installed: Joi.boolean().optional(),
  notes: Joi.string().max(500).optional().allow(null, ''),
})

export const createDealerQuoteSchema = Joi.object({
  dealerUnitId: Joi.string().required().messages({
    'any.required': 'La unidad es requerida',
  }),
  customerId: Joi.string().required().messages({
    'any.required': 'El cliente es requerido',
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
  currency: Joi.string().valid('USD', 'VES', 'EUR').optional(),
  exchangeRate: Joi.number().positive().optional().allow(null),
  exchangeRateSource: Joi.string().valid('BCV_AUTO', 'MANUAL').optional().allow(null, ''),
  validUntil: Joi.date().iso().optional().allow(null),
  paymentTerms: Joi.string().optional().allow(null, ''),
  financingRequired: Joi.boolean().optional(),
  notes: Joi.string().optional().allow(null, ''),
  status: Joi.string().valid('DRAFT', 'SENT', 'NEGOTIATING', 'APPROVED', 'REJECTED', 'EXPIRED', 'CONVERTED').optional(),
  adminFees: Joi.number().min(0).optional().allow(null),
  tradeInValue: Joi.number().min(0).optional().allow(null),
  requiredDeposit: Joi.number().min(0).optional().allow(null),
  accessories: Joi.array().items(accessorySchema).optional(),
})

export const updateDealerQuoteSchema = Joi.object({
  customerId: Joi.string().optional(),
  customerName: Joi.string().max(180).optional(),
  customerDocument: Joi.string().max(60).optional().allow(null, ''),
  customerPhone: Joi.string().max(40).optional().allow(null, ''),
  customerEmail: Joi.string().email().max(180).optional().allow(null, ''),
  listPrice: Joi.number().min(0).optional().allow(null),
  discountPct: Joi.number().min(0).max(100).optional().allow(null),
  offeredPrice: Joi.number().min(0).optional().allow(null),
  taxPct: Joi.number().min(0).max(100).optional().allow(null),
  currency: Joi.string().valid('USD', 'VES', 'EUR').optional(),
  exchangeRate: Joi.number().positive().optional().allow(null),
  exchangeRateSource: Joi.string().valid('BCV_AUTO', 'MANUAL').optional().allow(null, ''),
  validUntil: Joi.date().iso().optional().allow(null),
  paymentTerms: Joi.string().optional().allow(null, ''),
  financingRequired: Joi.boolean().optional(),
  notes: Joi.string().optional().allow(null, ''),
  status: Joi.string().valid('DRAFT', 'SENT', 'NEGOTIATING', 'APPROVED', 'REJECTED', 'EXPIRED', 'CONVERTED').optional(),
  isActive: Joi.boolean().optional(),
  adminFees: Joi.number().min(0).optional().allow(null),
  tradeInValue: Joi.number().min(0).optional().allow(null),
  requiredDeposit: Joi.number().min(0).optional().allow(null),
  accessories: Joi.array().items(accessorySchema).optional(),
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

export const convertAndFiscalizeDealerQuoteSchema = Joi.object({
  force: Joi.boolean().optional().default(false),
})
