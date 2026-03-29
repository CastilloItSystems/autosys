// backend/src/features/crm/interactions/interactions.validation.ts

import Joi from 'joi'

export const createInteractionSchema = Joi.object({
  customerId: Joi.string().uuid().required().messages({
    'any.required': 'El cliente es requerido',
    'string.guid': 'El customerId debe ser un UUID válido',
  }),
  type: Joi.string()
    .valid('CALL', 'WHATSAPP', 'EMAIL', 'VISIT', 'NOTE', 'QUOTE', 'FOLLOW_UP', 'MEETING')
    .required()
    .messages({
      'any.required': 'El tipo de interacción es requerido',
      'any.only': 'Tipo de interacción inválido',
    }),
  notes: Joi.string().required().messages({
    'any.required': 'Las notas son requeridas',
  }),
  channel: Joi.string()
    .valid('REPUESTOS', 'TALLER', 'VEHICULOS', 'GENERAL')
    .optional()
    .default('GENERAL'),
  direction: Joi.string()
    .valid('INBOUND', 'OUTBOUND')
    .optional()
    .default('OUTBOUND'),
  subject: Joi.string().max(255).optional().allow(null, ''),
  outcome: Joi.string().optional().allow(null, ''),
  nextAction: Joi.string().max(255).optional().allow(null, ''),
  nextActionAt: Joi.string().isoDate().optional().allow(null, ''),
  leadId: Joi.string().uuid().optional().allow(null, ''),
})

export const updateInteractionSchema = Joi.object({
  type: Joi.string()
    .valid('CALL', 'WHATSAPP', 'EMAIL', 'VISIT', 'NOTE', 'QUOTE', 'FOLLOW_UP', 'MEETING')
    .optional(),
  notes: Joi.string().optional(),
  channel: Joi.string().valid('REPUESTOS', 'TALLER', 'VEHICULOS', 'GENERAL').optional(),
  direction: Joi.string().valid('INBOUND', 'OUTBOUND').optional(),
  subject: Joi.string().max(255).optional().allow(null, ''),
  outcome: Joi.string().optional().allow(null, ''),
  nextAction: Joi.string().max(255).optional().allow(null, ''),
  nextActionAt: Joi.string().isoDate().optional().allow(null, ''),
  leadId: Joi.string().uuid().optional().allow(null, ''),
})

export const interactionFiltersSchema = Joi.object({
  customerId: Joi.string().uuid().optional().allow(''),
  leadId: Joi.string().uuid().optional().allow(''),
  type: Joi.string()
    .valid('CALL', 'WHATSAPP', 'EMAIL', 'VISIT', 'NOTE', 'QUOTE', 'FOLLOW_UP', 'MEETING')
    .optional(),
  channel: Joi.string().valid('REPUESTOS', 'TALLER', 'VEHICULOS', 'GENERAL').optional(),
  createdBy: Joi.string().uuid().optional().allow(''),
  dateFrom: Joi.string().isoDate().optional().allow(''),
  dateTo: Joi.string().isoDate().optional().allow(''),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(20),
  sortBy: Joi.string().valid('createdAt', 'type', 'channel').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
})
