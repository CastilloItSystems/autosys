import Joi from 'joi'

export const dealerHistoryFiltersSchema = Joi.object({
  search: Joi.string().max(200).optional().allow(''),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(20),
})
