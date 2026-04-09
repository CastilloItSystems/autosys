// backend/src/features/workshop/attachments/attachments.validation.ts
import Joi from 'joi'

const ENTITY_TYPES = [
  'SERVICE_ORDER', 'VEHICLE_RECEPTION', 'SERVICE_DIAGNOSIS',
  'WORKSHOP_WARRANTY', 'SERVICE_APPOINTMENT', 'QUALITY_CHECK',
]
const FILE_TYPES = ['IMAGE', 'VIDEO', 'PDF', 'DOCUMENT', 'OTHER']

export const createAttachmentSchema = Joi.object({
  entityType: Joi.string().valid(...ENTITY_TYPES).required()
    .messages({ 'any.required': 'El tipo de entidad es requerido' }),
  entityId: Joi.string().required()
    .messages({ 'any.required': 'El ID de la entidad es requerido' }),
  url: Joi.string().uri().required()
    .messages({ 'any.required': 'La URL del archivo es requerida' }),
  name: Joi.string().trim().min(1).max(255).required()
    .messages({ 'any.required': 'El nombre del archivo es requerido' }),
  fileType: Joi.string().valid(...FILE_TYPES).default('OTHER'),
  description: Joi.string().trim().max(500).optional().allow('', null),
  mimeType: Joi.string().trim().max(100).optional().allow('', null),
  sizeBytes: Joi.number().integer().min(0).optional(),
})

export const listAttachmentsSchema = Joi.object({
  entityType: Joi.string().valid(...ENTITY_TYPES).required(),
  entityId: Joi.string().required(),
})
