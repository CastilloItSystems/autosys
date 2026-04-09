// backend/src/features/crm/cases/cases.validation.ts

import Joi from 'joi'

const CASE_TYPES = [
  'SALE_COMPLAINT',
  'WORKSHOP_COMPLAINT',
  'PARTS_COMPLAINT',
  'WARRANTY',
  'GENERAL_INQUIRY',
  'SUGGESTION',
  'INCIDENT',
  'SERVICE_COMPLAINT',
]

const CASE_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

const CASE_STATUSES = [
  'OPEN',
  'IN_ANALYSIS',
  'IN_PROGRESS',
  'WAITING_CLIENT',
  'ESCALATED',
  'RESOLVED',
  'CLOSED',
  'REJECTED',
]

export const createCaseSchema = Joi.object({
  title: Joi.string().max(255).required().messages({
    'any.required': 'El título es requerido',
    'string.max': 'El título no puede exceder 255 caracteres',
  }),
  description: Joi.string().required().messages({
    'any.required': 'La descripción es requerida',
  }),
  type: Joi.string()
    .valid(...CASE_TYPES)
    .required()
    .messages({
      'any.required': 'El tipo de caso es requerido',
      'any.only': `Tipo de caso inválido. Valores válidos: ${CASE_TYPES.join(', ')}`,
    }),
  priority: Joi.string()
    .valid(...CASE_PRIORITIES)
    .default('MEDIUM')
    .messages({
      'any.only': `Prioridad inválida. Valores válidos: ${CASE_PRIORITIES.join(', ')}`,
    }),
  customerId: Joi.string().uuid().required().messages({
    'any.required': 'El cliente es requerido',
    'string.guid': 'El customerId debe ser un UUID válido',
  }),
  customerVehicleId: Joi.string().uuid().optional().allow(null, ''),
  leadId: Joi.string().uuid().optional().allow(null, ''),
  refDocType: Joi.string().optional().allow(null, ''),
  refDocId: Joi.string().optional().allow(null, ''),
  refDocNumber: Joi.string().optional().allow(null, ''),
  assignedTo: Joi.string().optional().allow(null, ''),
})

export const updateCaseSchema = Joi.object({
  title: Joi.string().max(255).optional(),
  description: Joi.string().optional(),
  priority: Joi.string()
    .valid(...CASE_PRIORITIES)
    .optional()
    .messages({
      'any.only': `Prioridad inválida. Valores válidos: ${CASE_PRIORITIES.join(', ')}`,
    }),
  assignedTo: Joi.string().optional().allow(null, ''),
  customerVehicleId: Joi.string().uuid().optional().allow(null, ''),
  leadId: Joi.string().uuid().optional().allow(null, ''),
  refDocType: Joi.string().optional().allow(null, ''),
  refDocId: Joi.string().optional().allow(null, ''),
  refDocNumber: Joi.string().optional().allow(null, ''),
})

export const updateCaseStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...CASE_STATUSES)
    .required()
    .messages({
      'any.required': 'El estado es requerido',
      'any.only': `Estado de caso inválido. Valores válidos: ${CASE_STATUSES.join(', ')}`,
    }),
  resolution: Joi.string().optional().allow(null, ''),
  rootCause: Joi.string().optional().allow(null, ''),
})

export const addCommentSchema = Joi.object({
  comment: Joi.string().min(1).required().messages({
    'any.required': 'El comentario es requerido',
    'string.min': 'El comentario no puede estar vacío',
  }),
  isInternal: Joi.boolean().default(false),
})

export const caseFiltersSchema = Joi.object({
  type: Joi.string().valid(...CASE_TYPES).optional(),
  priority: Joi.string().valid(...CASE_PRIORITIES).optional(),
  status: Joi.string().valid(...CASE_STATUSES).optional(),
  customerId: Joi.string().uuid().optional().allow(''),
  assignedTo: Joi.string().optional().allow(''),
  search: Joi.string().optional().allow(''),
  dateFrom: Joi.string().isoDate().optional().allow(''),
  dateTo: Joi.string().isoDate().optional().allow(''),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(20),
  sortBy: Joi.string().valid('createdAt', 'slaDeadline', 'priority', 'status').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
})
