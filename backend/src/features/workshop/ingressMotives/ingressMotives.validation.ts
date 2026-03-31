import Joi from 'joi'

export const createIngressMotiveSchema = Joi.object({
  code: Joi.string()
    .required()
    .messages({ 'any.required': 'El código es requerido' }),
  name: Joi.string()
    .required()
    .messages({ 'any.required': 'El nombre es requerido' }),
  description: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
})

export const updateIngressMotiveSchema = Joi.object({
  code: Joi.string().optional(),
  name: Joi.string().optional(),
  description: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
}).min(1)

export const ingressMotiveFiltersSchema = Joi.object({
  isActive: Joi.string().valid('true', 'false').optional(),
  search: Joi.string().optional(),
  page: Joi.number().integer().positive().optional(),
  limit: Joi.number().integer().positive().optional(),
})
