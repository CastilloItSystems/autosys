import Joi from 'joi'

const TYPES = ['DISCOUNT_EXCEPTION', 'TRADE_IN_APPROVAL', 'FINANCING_OVERRIDE', 'DELIVERY_EXCEPTION', 'DOCUMENT_EXCEPTION']
const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']

export const createDealerApprovalSchema = Joi.object({
  dealerUnitId: Joi.string().optional().allow(null, ''),
  referenceType: Joi.string().max(80).optional().allow(null, ''),
  referenceId: Joi.string().optional().allow(null, ''),
  type: Joi.string().valid(...TYPES).required(),
  status: Joi.string().valid(...STATUSES).optional(),
  title: Joi.string().max(220).required(),
  reason: Joi.string().optional().allow(null, ''),
  requestedBy: Joi.string().max(120).optional().allow(null, ''),
  requestedAmount: Joi.number().min(0).optional().allow(null),
  requestedPct: Joi.number().min(0).max(100).optional().allow(null),
  resolutionNotes: Joi.string().optional().allow(null, ''),
})

export const updateDealerApprovalSchema = Joi.object({
  dealerUnitId: Joi.string().optional().allow(null, ''),
  referenceType: Joi.string().max(80).optional().allow(null, ''),
  referenceId: Joi.string().optional().allow(null, ''),
  type: Joi.string().valid(...TYPES).optional(),
  status: Joi.string().valid(...STATUSES).optional(),
  title: Joi.string().max(220).optional(),
  reason: Joi.string().optional().allow(null, ''),
  requestedBy: Joi.string().max(120).optional().allow(null, ''),
  requestedAmount: Joi.number().min(0).optional().allow(null),
  requestedPct: Joi.number().min(0).max(100).optional().allow(null),
  resolutionNotes: Joi.string().optional().allow(null, ''),
  isActive: Joi.boolean().optional(),
})

export const dealerApprovalFiltersSchema = Joi.object({
  dealerUnitId: Joi.string().optional().allow(''),
  type: Joi.string().valid(...TYPES).optional().allow(''),
  status: Joi.string().valid(...STATUSES).optional().allow(''),
  isActive: Joi.boolean().optional(),
  search: Joi.string().max(200).optional().allow(''),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(20),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'status', 'type').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
})
