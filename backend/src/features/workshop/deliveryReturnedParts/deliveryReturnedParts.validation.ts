// backend/src/features/workshop/deliveryReturnedParts/deliveryReturnedParts.validation.ts
import Joi from 'joi'

const CONDITIONS = ['WHOLE', 'DAMAGED', 'IN_PIECES', 'REPLACED', 'OTHER']

export const createReturnedPartSchema = Joi.object({
  deliveryId: Joi.string().required(),
  materialId: Joi.string().allow('', null).optional(),
  description: Joi.string().min(2).required(),
  quantity: Joi.number().min(0.01).optional(),
  condition: Joi.string().valid(...CONDITIONS).optional(),
  clientAcknowledged: Joi.boolean().optional(),
  clientSignature: Joi.string().allow('', null).optional(),
  photoUrl: Joi.string().allow('', null).optional(),
  notes: Joi.string().allow('', null).optional(),
})

export const updateReturnedPartSchema = Joi.object({
  materialId: Joi.string().allow('', null).optional(),
  description: Joi.string().min(2).optional(),
  quantity: Joi.number().min(0.01).optional(),
  condition: Joi.string().valid(...CONDITIONS).optional(),
  clientAcknowledged: Joi.boolean().optional(),
  clientSignature: Joi.string().allow('', null).optional(),
  photoUrl: Joi.string().allow('', null).optional(),
  notes: Joi.string().allow('', null).optional(),
})
