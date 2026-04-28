import Joi from 'joi'

export const auditLogFiltersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(50),
  entity: Joi.string().max(120).optional(),
  entityId: Joi.string().max(120).optional(),
  action: Joi.string().max(80).optional(),
  actions: Joi.alternatives()
    .try(Joi.string().max(500), Joi.array().items(Joi.string().max(80)))
    .optional(),
  userId: Joi.string().optional(),
  createdFrom: Joi.date().iso().optional(),
  createdTo: Joi.date().iso().optional(),
})
