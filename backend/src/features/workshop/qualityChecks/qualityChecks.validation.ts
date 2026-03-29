// backend/src/features/workshop/qualityChecks/qualityChecks.validation.ts
import Joi from 'joi'

const checklistItemSchema = Joi.object({
  item: Joi.string().trim().max(200).required(),
  passed: Joi.boolean().required(),
  notes: Joi.string().trim().max(500).optional().allow(''),
})

export const createQualityCheckSchema = Joi.object({
  serviceOrderId: Joi.string().required().messages({ 'any.required': 'La orden de trabajo es requerida' }),
  inspectorId: Joi.string().required().messages({ 'any.required': 'El inspector es requerido' }),
  checklistItems: Joi.array().items(checklistItemSchema).optional(),
  notes: Joi.string().trim().max(1000).optional().allow(''),
})

export const submitQualityCheckSchema = Joi.object({
  checklistItems: Joi.array().items(checklistItemSchema).min(1).required().messages({
    'array.min': 'Debe incluir al menos un ítem en el checklist',
    'any.required': 'El checklist es requerido',
  }),
  failureNotes: Joi.string().trim().max(2000).optional().allow(''),
  notes: Joi.string().trim().max(1000).optional().allow(''),
})
