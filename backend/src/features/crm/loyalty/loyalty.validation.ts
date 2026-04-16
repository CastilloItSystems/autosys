import Joi from 'joi'

export const createLoyaltyRecordSchema = Joi.object({
  type: Joi.string().valid('EVENT', 'SURVEY').required(),
  customerId: Joi.string().uuid().required(),

  eventType: Joi.when('type', {
    is: 'EVENT',
    then: Joi.string().valid('NPS_SENT', 'NPS_RECEIVED', 'MAINTENANCE_REMINDER', 'REACTIVATION_CONTACT', 'FOLLOW_UP').required(),
    otherwise: Joi.string().optional().allow(null, ''),
  }),
  title: Joi.string().max(200).optional().allow(null, ''),
  description: Joi.string().optional().allow(null, ''),
  suggestedAction: Joi.string().max(255).optional().allow(null, ''),
  dueAt: Joi.string().isoDate().optional().allow(null, ''),
  status: Joi.string().valid('PENDING', 'DONE', 'CANCELLED').optional(),

  source: Joi.when('type', {
    is: 'SURVEY',
    then: Joi.string().max(60).optional().default('NPS'),
    otherwise: Joi.string().optional().allow(null, ''),
  }),
  score: Joi.when('type', {
    is: 'SURVEY',
    then: Joi.number().integer().min(0).max(10).optional().allow(null),
    otherwise: Joi.number().optional().allow(null),
  }),
  feedback: Joi.when('type', {
    is: 'SURVEY',
    then: Joi.string().optional().allow(null, ''),
    otherwise: Joi.string().optional().allow(null, ''),
  }),
})

export const loyaltyFiltersSchema = Joi.object({
  customerId: Joi.string().uuid().optional().allow(''),
  status: Joi.string().valid('PENDING', 'DONE', 'CANCELLED').optional(),
  type: Joi.string().valid('NPS_SENT', 'NPS_RECEIVED', 'MAINTENANCE_REMINDER', 'REACTIVATION_CONTACT', 'FOLLOW_UP').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(20),
})
