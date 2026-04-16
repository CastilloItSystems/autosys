// backend/src/features/crm/leads/leads.validation.ts

import Joi from 'joi'
const CUID_PATTERN = /^[a-z0-9]{24,36}$/i

export const createLeadSchema = Joi.object({
  title: Joi.string().max(255).required().messages({
    'any.required': 'El título es requerido',
    'string.max': 'El título no puede exceder 255 caracteres',
  }),
  channel: Joi.string()
    .valid('REPUESTOS', 'TALLER', 'VEHICULOS')
    .required()
    .messages({
      'any.required': 'El canal es requerido',
      'any.only': 'Canal inválido',
    }),
  source: Joi.string()
    .valid('WALK_IN', 'REFERRAL', 'PHONE', 'WHATSAPP', 'SOCIAL_MEDIA', 'WEBSITE', 'EMAIL', 'OTHER')
    .required()
    .messages({
      'any.required': 'La fuente es requerida',
      'any.only': 'Fuente inválida',
    }),
  customerId: Joi.string().uuid().optional().allow(null, ''),
  description: Joi.string().optional().allow(null, ''),
  estimatedValue: Joi.number().min(0).optional().allow(null),
  currency: Joi.string().max(10).optional().default('USD'),
  assignedTo: Joi.string().uuid().optional().allow(null, ''),
  expectedCloseAt: Joi.string().isoDate().optional().allow(null, ''),
})

export const updateLeadSchema = Joi.object({
  title: Joi.string().max(255).optional(),
  channel: Joi.string().valid('REPUESTOS', 'TALLER', 'VEHICULOS').optional(),
  source: Joi.string()
    .valid('WALK_IN', 'REFERRAL', 'PHONE', 'WHATSAPP', 'SOCIAL_MEDIA', 'WEBSITE', 'EMAIL', 'OTHER')
    .optional(),
  customerId: Joi.string().uuid().optional().allow(null, ''),
  description: Joi.string().optional().allow(null, ''),
  estimatedValue: Joi.number().min(0).optional().allow(null),
  currency: Joi.string().max(10).optional(),
  assignedTo: Joi.string().uuid().optional().allow(null, ''),
  expectedCloseAt: Joi.string().isoDate().optional().allow(null, ''),
  lostReason: Joi.string().optional().allow(null, ''),
  closedAt: Joi.string().isoDate().optional().allow(null, ''),
})

export const updateLeadStatusSchema = Joi.object({
  status: Joi.string()
    .valid('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST')
    .required()
    .messages({
      'any.required': 'El estado es requerido',
      'any.only': 'Estado inválido',
    }),
  lostReason: Joi.when('status', {
    is: 'LOST',
    then: Joi.string().required().messages({
      'any.required': 'La razón de pérdida es requerida cuando el estado es LOST',
    }),
    otherwise: Joi.string().optional().allow(null, ''),
  }),
  closedAt: Joi.string().isoDate().optional().allow(null, ''),
})

export const convertLeadSchema = Joi.object({
  ownerId: Joi.string().uuid().optional().allow(null, ''),
  nextActivityAt: Joi.string().isoDate().required().messages({
    'any.required': 'nextActivityAt es requerido',
  }),
  stageCode: Joi.string().trim().max(80).optional().allow(null, ''),
  expectedCloseAt: Joi.string().isoDate().optional().allow(null, ''),
  amount: Joi.number().min(0).optional().allow(null),
  campaignId: Joi.string().pattern(CUID_PATTERN).optional().allow(null, ''),
  notes: Joi.string().trim().max(1000).optional().allow(null, ''),
})

export const leadFiltersSchema = Joi.object({
  channel: Joi.string().valid('REPUESTOS', 'TALLER', 'VEHICULOS').optional(),
  status: Joi.string()
    .valid('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST')
    .optional(),
  assignedTo: Joi.string().uuid().optional().allow(''),
  customerId: Joi.string().uuid().optional().allow(''),
  search: Joi.string().max(200).optional().allow(''),
  dateFrom: Joi.string().isoDate().optional().allow(''),
  dateTo: Joi.string().isoDate().optional().allow(''),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(20),
  sortBy: Joi.string()
    .valid('createdAt', 'expectedCloseAt', 'estimatedValue', 'title')
    .default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
})
