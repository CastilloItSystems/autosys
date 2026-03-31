// backend/src/features/workshop/diagnoses/diagnoses.validation.ts
import Joi from 'joi'

const DIAGNOSIS_STATUS = ['DRAFT', 'COMPLETED', 'APPROVED_INTERNAL']
const FINDING_SEVERITY = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

export const createDiagnosisSchema = Joi.object({
  receptionId: Joi.string().optional(),
  serviceOrderId: Joi.string().optional(),
  technicianId: Joi.string().optional(),
  generalNotes: Joi.string().trim().max(1000).optional().allow(''),
  severity: Joi.string()
    .valid(...FINDING_SEVERITY)
    .optional()
    .default('LOW'),
})

export const updateDiagnosisSchema = Joi.object({
  status: Joi.string()
    .valid(...DIAGNOSIS_STATUS)
    .optional(),
  generalNotes: Joi.string().trim().max(1000).optional().allow(''),
  severity: Joi.string()
    .valid(...FINDING_SEVERITY)
    .optional(),
  technicianId: Joi.string().optional(),
  startedAt: Joi.date().iso().optional(),
  finishedAt: Joi.date().iso().optional(),
})
  .min(1)
  .messages({
    'object.min': 'Debe proporcionar al menos un campo para actualizar',
  })

export const createFindingSchema = Joi.object({
  category: Joi.string().trim().max(50).optional().allow(''),
  description: Joi.string()
    .trim()
    .required()
    .messages({ 'any.required': 'La descripción es requerida' }),
  severity: Joi.string()
    .valid(...FINDING_SEVERITY)
    .optional()
    .default('MEDIUM'),
  requiresClientAuth: Joi.boolean().optional().default(true),
  observation: Joi.string().trim().max(1000).optional().allow(''),
})

export const createSuggestedOpSchema = Joi.object({
  operationId: Joi.string().optional(),
  description: Joi.string()
    .trim()
    .required()
    .messages({ 'any.required': 'La descripción es requerida' }),
  estimatedMins: Joi.number().integer().min(0).optional().default(0),
  estimatedPrice: Joi.number().min(0).optional().default(0),
})

export const createSuggestedPartSchema = Joi.object({
  itemId: Joi.string().optional(),
  description: Joi.string()
    .trim()
    .required()
    .messages({ 'any.required': 'La descripción es requerida' }),
  quantity: Joi.number().min(0.01).optional().default(1),
  estimatedCost: Joi.number().min(0).optional().default(0),
  estimatedPrice: Joi.number().min(0).optional().default(0),
})
