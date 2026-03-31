// backend/src/features/workshop/receptionMedia/receptionMedia.validation.ts
import Joi from 'joi'

const DAMAGE_SEVERITIES = ['MINOR', 'MODERATE', 'SEVERE']
const PHOTO_TYPES = ['FRONTAL', 'REAR', 'LEFT', 'RIGHT', 'INTERIOR', 'DAMAGE', 'DOCUMENT', 'OTHER']

export const createDamageSchema = Joi.object({
  zone: Joi.string().trim().min(1).max(150).required()
    .messages({ 'any.required': 'La zona del daño es requerida' }),
  description: Joi.string().trim().min(1).max(1000).required()
    .messages({ 'any.required': 'La descripción es requerida' }),
  severity: Joi.string().valid(...DAMAGE_SEVERITIES).default('MINOR'),
  photoUrl: Joi.string().uri().optional().allow('', null),
})

export const updateDamageSchema = Joi.object({
  zone: Joi.string().trim().min(1).max(150).optional(),
  description: Joi.string().trim().min(1).max(1000).optional(),
  severity: Joi.string().valid(...DAMAGE_SEVERITIES).optional(),
  photoUrl: Joi.string().uri().optional().allow('', null),
}).min(1).messages({ 'object.min': 'Debe proporcionar al menos un campo para actualizar' })

export const createPhotoSchema = Joi.object({
  url: Joi.string().uri().required()
    .messages({ 'any.required': 'La URL de la foto es requerida' }),
  type: Joi.string().valid(...PHOTO_TYPES).default('OTHER'),
  description: Joi.string().trim().max(500).optional().allow('', null),
})
