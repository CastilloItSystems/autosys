import Joi from 'joi'

export const createDealerFinancingSchema = Joi.object({
  dealerUnitId: Joi.string().required(),
  customerName: Joi.string().max(180).required(),
  customerDocument: Joi.string().max(60).optional().allow(null, ''),
  customerPhone: Joi.string().max(40).optional().allow(null, ''),
  customerEmail: Joi.string().email().max(180).optional().allow(null, ''),
  bankName: Joi.string().max(120).optional().allow(null, ''),
  planName: Joi.string().max(120).optional().allow(null, ''),
  requestedAmount: Joi.number().min(0).optional().allow(null),
  downPaymentAmount: Joi.number().min(0).optional().allow(null),
  approvedAmount: Joi.number().min(0).optional().allow(null),
  termMonths: Joi.number().integer().min(1).optional().allow(null),
  annualRatePct: Joi.number().min(0).max(100).optional().allow(null),
  installmentAmount: Joi.number().min(0).optional().allow(null),
  currency: Joi.string().max(8).optional().allow(null, ''),
  notes: Joi.string().optional().allow(null, ''),
  status: Joi.string().valid('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED', 'DISBURSED').optional(),
})

export const updateDealerFinancingSchema = createDealerFinancingSchema.keys({
  dealerUnitId: Joi.string().optional(),
  customerName: Joi.string().max(180).optional(),
  isActive: Joi.boolean().optional(),
})

export const dealerFinancingFiltersSchema = Joi.object({
  dealerUnitId: Joi.string().optional().allow(''),
  status: Joi.string()
    .valid('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED', 'DISBURSED')
    .optional()
    .allow(''),
  isActive: Joi.boolean().optional(),
  search: Joi.string().max(200).optional().allow(''),
  fromDate: Joi.date().iso().optional(),
  toDate: Joi.date().iso().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(20),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'status', 'requestedAmount', 'approvedAmount').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
})
