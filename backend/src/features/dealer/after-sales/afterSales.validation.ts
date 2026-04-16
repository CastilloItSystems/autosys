import Joi from 'joi'

const TYPES = ['WARRANTY_CHECK', 'FIRST_SERVICE', 'SATISFACTION_CALL', 'CLAIM']
const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED']

export const createDealerAfterSaleSchema = Joi.object({
  dealerUnitId: Joi.string().optional().allow(null, ''),
  referenceType: Joi.string().max(80).optional().allow(null, ''),
  referenceId: Joi.string().optional().allow(null, ''),
  type: Joi.string().valid(...TYPES).required(),
  status: Joi.string().valid(...STATUSES).optional(),
  customerName: Joi.string().max(180).required(),
  customerPhone: Joi.string().max(40).optional().allow(null, ''),
  customerEmail: Joi.string().email().max(180).optional().allow(null, ''),
  title: Joi.string().max(220).required(),
  description: Joi.string().optional().allow(null, ''),
  dueAt: Joi.date().iso().optional().allow(null),
  assignedTo: Joi.string().max(120).optional().allow(null, ''),
  resolutionNotes: Joi.string().optional().allow(null, ''),
  satisfactionScore: Joi.number().integer().min(1).max(5).optional().allow(null),
})

export const updateDealerAfterSaleSchema = Joi.object({
  dealerUnitId: Joi.string().optional().allow(null, ''),
  referenceType: Joi.string().max(80).optional().allow(null, ''),
  referenceId: Joi.string().optional().allow(null, ''),
  type: Joi.string().valid(...TYPES).optional(),
  status: Joi.string().valid(...STATUSES).optional(),
  customerName: Joi.string().max(180).optional(),
  customerPhone: Joi.string().max(40).optional().allow(null, ''),
  customerEmail: Joi.string().email().max(180).optional().allow(null, ''),
  title: Joi.string().max(220).optional(),
  description: Joi.string().optional().allow(null, ''),
  dueAt: Joi.date().iso().optional().allow(null),
  assignedTo: Joi.string().max(120).optional().allow(null, ''),
  resolutionNotes: Joi.string().optional().allow(null, ''),
  satisfactionScore: Joi.number().integer().min(1).max(5).optional().allow(null),
  isActive: Joi.boolean().optional(),
})

export const dealerAfterSaleFiltersSchema = Joi.object({
  dealerUnitId: Joi.string().optional().allow(''),
  type: Joi.string().valid(...TYPES).optional().allow(''),
  status: Joi.string().valid(...STATUSES).optional().allow(''),
  isActive: Joi.boolean().optional(),
  search: Joi.string().max(200).optional().allow(''),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(20),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'status', 'dueAt').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
})
