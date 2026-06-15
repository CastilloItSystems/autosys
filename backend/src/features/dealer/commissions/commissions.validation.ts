import Joi from 'joi'

const STATUSES = ['PENDING', 'APPROVED', 'PAID', 'CANCELLED']

export const updateDealerCommissionSchema = Joi.object({
  status: Joi.string().valid(...STATUSES).optional(),
  commissionPct: Joi.number().min(0).max(100).optional(),
  sellerId: Joi.string().optional().allow(null, ''),
  sellerName: Joi.string().max(160).optional().allow(null, ''),
  notes: Joi.string().max(1000).optional().allow(null, ''),
  isActive: Joi.boolean().optional(),
})

export const dealerCommissionFiltersSchema = Joi.object({
  dealerQuoteId: Joi.string().optional().allow(''),
  sellerId: Joi.string().optional().allow(''),
  status: Joi.string().valid(...STATUSES).optional().allow(''),
  isActive: Joi.boolean().optional(),
  search: Joi.string().max(200).optional().allow(''),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(20),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'status', 'commissionAmount').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
})
