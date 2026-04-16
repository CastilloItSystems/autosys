import Joi from 'joi'

const REFERENCE_TYPES = ['UNIT', 'RESERVATION', 'QUOTE', 'TEST_DRIVE', 'TRADE_IN', 'FINANCING', 'DELIVERY', 'CUSTOMER']
const STATUSES = ['PENDING', 'VALID', 'EXPIRED', 'REJECTED']

export const createDealerDocumentSchema = Joi.object({
  dealerUnitId: Joi.string().optional().allow(null, ''),
  referenceType: Joi.string().valid(...REFERENCE_TYPES).required(),
  referenceId: Joi.string().optional().allow(null, ''),
  documentType: Joi.string().max(120).required(),
  documentNumber: Joi.string().max(120).optional().allow(null, ''),
  name: Joi.string().max(240).required(),
  fileUrl: Joi.string().uri().required(),
  mimeType: Joi.string().max(120).optional().allow(null, ''),
  sizeBytes: Joi.number().integer().min(0).optional().allow(null),
  issuedAt: Joi.date().iso().optional().allow(null),
  expiresAt: Joi.date().iso().optional().allow(null),
  status: Joi.string().valid(...STATUSES).optional(),
  notes: Joi.string().optional().allow(null, ''),
})

export const updateDealerDocumentSchema = Joi.object({
  dealerUnitId: Joi.string().optional().allow(null, ''),
  referenceType: Joi.string().valid(...REFERENCE_TYPES).optional(),
  referenceId: Joi.string().optional().allow(null, ''),
  documentType: Joi.string().max(120).optional(),
  documentNumber: Joi.string().max(120).optional().allow(null, ''),
  name: Joi.string().max(240).optional(),
  fileUrl: Joi.string().uri().optional(),
  mimeType: Joi.string().max(120).optional().allow(null, ''),
  sizeBytes: Joi.number().integer().min(0).optional().allow(null),
  issuedAt: Joi.date().iso().optional().allow(null),
  expiresAt: Joi.date().iso().optional().allow(null),
  status: Joi.string().valid(...STATUSES).optional(),
  notes: Joi.string().optional().allow(null, ''),
  isActive: Joi.boolean().optional(),
})

export const dealerDocumentFiltersSchema = Joi.object({
  dealerUnitId: Joi.string().optional().allow(''),
  referenceType: Joi.string().valid(...REFERENCE_TYPES).optional().allow(''),
  referenceId: Joi.string().optional().allow(''),
  status: Joi.string().valid(...STATUSES).optional().allow(''),
  isActive: Joi.boolean().optional(),
  search: Joi.string().max(200).optional().allow(''),
  expiringDays: Joi.number().integer().min(0).max(365).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(20),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'status', 'expiresAt').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
})
