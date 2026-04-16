import Joi from 'joi'

export const createCampaignSchema = Joi.object({
  name: Joi.string().trim().max(150).required(),
  description: Joi.string().optional().allow(null, ''),
  status: Joi.string().valid('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED').optional().default('DRAFT'),
  channel: Joi.string().valid('EMAIL', 'WHATSAPP', 'PHONE', 'SOCIAL_MEDIA', 'WEB', 'OTHER').required(),
  budget: Joi.number().min(0).optional().allow(null),
  startsAt: Joi.string().isoDate().optional().allow(null, ''),
  endsAt: Joi.string().isoDate().optional().allow(null, ''),
})

export const campaignFiltersSchema = Joi.object({
  status: Joi.string().valid('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED').optional(),
  channel: Joi.string().valid('EMAIL', 'WHATSAPP', 'PHONE', 'SOCIAL_MEDIA', 'WEB', 'OTHER').optional(),
  search: Joi.string().max(200).optional().allow(''),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(20),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'name', 'startsAt').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
})
