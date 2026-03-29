// backend/src/features/crm/activities/activities.validation.ts

import Joi from 'joi'

export const createActivitySchema = Joi.object({
  customerId: Joi.string().uuid().required().messages({
    'any.required': 'El cliente es requerido',
    'string.guid': 'El customerId debe ser un UUID válido',
  }),
  type: Joi.string()
    .valid('CALL', 'EMAIL', 'WHATSAPP', 'MEETING', 'QUOTE', 'TASK')
    .required()
    .messages({
      'any.required': 'El tipo de actividad es requerido',
      'any.only': 'Tipo de actividad inválido',
    }),
  title: Joi.string().max(255).required().messages({
    'any.required': 'El título es requerido',
    'string.max': 'El título no puede exceder 255 caracteres',
  }),
  assignedTo: Joi.string().uuid().required().messages({
    'any.required': 'El responsable es requerido',
    'string.guid': 'El assignedTo debe ser un UUID válido',
  }),
  dueAt: Joi.string().isoDate().required().messages({
    'any.required': 'La fecha límite es requerida',
    'string.isoDate': 'La fecha límite debe ser una fecha ISO válida',
  }),
  leadId: Joi.string().uuid().optional().allow(null, ''),
  description: Joi.string().optional().allow(null, ''),
})

export const updateActivitySchema = Joi.object({
  customerId: Joi.string().uuid().optional(),
  type: Joi.string().valid('CALL', 'EMAIL', 'WHATSAPP', 'MEETING', 'QUOTE', 'TASK').optional(),
  title: Joi.string().max(255).optional(),
  assignedTo: Joi.string().uuid().optional(),
  dueAt: Joi.string().isoDate().optional(),
  leadId: Joi.string().uuid().optional().allow(null, ''),
  description: Joi.string().optional().allow(null, ''),
  status: Joi.string()
    .valid('PENDING', 'IN_PROGRESS', 'DONE', 'CANCELLED')
    .optional(),
})

export const completeActivitySchema = Joi.object({
  outcome: Joi.string().optional().allow(null, ''),
  completedAt: Joi.string().isoDate().optional().allow(null, ''),
})

export const activityFiltersSchema = Joi.object({
  customerId: Joi.string().uuid().optional().allow(''),
  leadId: Joi.string().uuid().optional().allow(''),
  assignedTo: Joi.string().uuid().optional().allow(''),
  status: Joi.string()
    .valid('PENDING', 'IN_PROGRESS', 'DONE', 'CANCELLED')
    .optional(),
  type: Joi.string()
    .valid('CALL', 'EMAIL', 'WHATSAPP', 'MEETING', 'QUOTE', 'TASK')
    .optional(),
  dueBefore: Joi.string().isoDate().optional().allow(''),
  dueAfter: Joi.string().isoDate().optional().allow(''),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(20),
  sortBy: Joi.string().valid('dueAt', 'createdAt', 'title', 'status').default('dueAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
})
