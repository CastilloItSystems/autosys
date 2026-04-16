import Joi from 'joi'

const CHANNELS = ['REPUESTOS', 'TALLER', 'VEHICULOS'] as const
const CUID_PATTERN = /^[a-z0-9]{24,36}$/i

export const createOpportunitySchema = Joi.object({
  leadId: Joi.string().uuid().optional().allow(null, ''),
  customerId: Joi.string().uuid().optional().allow(null, ''),
  campaignId: Joi.string().pattern(CUID_PATTERN).optional().allow(null, ''),
  channel: Joi.string().valid(...CHANNELS).required(),
  stageCode: Joi.string().trim().max(80).optional().allow(null, ''),
  title: Joi.string().trim().max(255).required(),
  description: Joi.string().optional().allow(null, ''),
  amount: Joi.number().min(0).optional().allow(null),
  currency: Joi.string().max(10).optional().default('USD'),
  ownerId: Joi.string().uuid().optional().allow(null, ''),
  nextActivityAt: Joi.string().isoDate().required(),
  expectedCloseAt: Joi.string().isoDate().optional().allow(null, ''),
})

export const updateOpportunitySchema = Joi.object({
  customerId: Joi.string().uuid().optional().allow(null, ''),
  campaignId: Joi.string().pattern(CUID_PATTERN).optional().allow(null, ''),
  stageCode: Joi.string().trim().max(80).optional(),
  title: Joi.string().trim().max(255).optional(),
  description: Joi.string().optional().allow(null, ''),
  amount: Joi.number().min(0).optional().allow(null),
  currency: Joi.string().max(10).optional(),
  ownerId: Joi.string().uuid().optional(),
  nextActivityAt: Joi.string().isoDate().optional(),
  expectedCloseAt: Joi.string().isoDate().optional().allow(null, ''),
})

export const updateOpportunityStageSchema = Joi.object({
  stageCode: Joi.string().trim().max(80).required(),
  notes: Joi.string().trim().max(1000).optional().allow(null, ''),
})

export const closeOpportunitySchema = Joi.object({
  result: Joi.string().valid('WON', 'LOST').required(),
  lostReasonId: Joi.when('result', {
    is: 'LOST',
    then: Joi.string().pattern(CUID_PATTERN).optional().allow(null, ''),
    otherwise: Joi.string().optional().allow(null, ''),
  }),
  lostReasonText: Joi.when('result', {
    is: 'LOST',
    then: Joi.string().trim().required(),
    otherwise: Joi.string().optional().allow(null, ''),
  }),
  notes: Joi.string().trim().max(1000).optional().allow(null, ''),
})

export const opportunityFiltersSchema = Joi.object({
  channel: Joi.string().valid(...CHANNELS).optional(),
  stageCode: Joi.string().trim().max(80).optional(),
  status: Joi.string().valid('OPEN', 'WON', 'LOST').optional(),
  ownerId: Joi.string().uuid().optional().allow(''),
  customerId: Joi.string().uuid().optional().allow(''),
  campaignId: Joi.string().pattern(CUID_PATTERN).optional().allow(''),
  search: Joi.string().max(200).optional().allow(''),
  amountMin: Joi.number().min(0).optional(),
  amountMax: Joi.number().min(0).optional(),
  expectedFrom: Joi.string().isoDate().optional().allow(''),
  expectedTo: Joi.string().isoDate().optional().allow(''),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(20),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'expectedCloseAt', 'amount', 'title').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
})

export const createStageConfigSchema = Joi.object({
  channel: Joi.string().valid(...CHANNELS).required(),
  code: Joi.string().trim().max(80).required(),
  label: Joi.string().trim().max(120).required(),
  position: Joi.number().integer().min(1).required(),
  isTerminal: Joi.boolean().optional().default(false),
})

export const createLossReasonSchema = Joi.object({
  code: Joi.string().trim().max(80).required(),
  label: Joi.string().trim().max(120).required(),
  isActive: Joi.boolean().optional().default(true),
})
