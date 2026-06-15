// backend/src/features/workshop/roadTests/roadTests.validation.ts
import Joi from 'joi'

export const createRoadTestSchema = Joi.object({
  serviceOrderId: Joi.string().required().messages({
    'any.required': 'La orden de servicio es obligatoria',
  }),
  motive: Joi.string().min(3).required().messages({
    'any.required': 'El motivo es obligatorio',
  }),
  driverId: Joi.string().required(),
  driverName: Joi.string().allow('', null).optional(),
  technicianId: Joi.string().required(),
  technicianName: Joi.string().allow('', null).optional(),
  exitPassRef: Joi.string().allow('', null).optional(),
  notes: Joi.string().allow('', null).optional(),
})

export const updateRoadTestSchema = Joi.object({
  motive: Joi.string().min(3).optional(),
  notes: Joi.string().allow('', null).optional(),
  exitPassRef: Joi.string().allow('', null).optional(),
})

export const authorizeSchema = Joi.object({
  role: Joi.string().valid('MANAGER', 'ADVISOR', 'SHOP_FOREMAN').required(),
  userId: Joi.string().required(),
})

export const clientAuthorizeSchema = Joi.object({
  clientName: Joi.string().required(),
  signatureUrl: Joi.string().allow('', null).optional(),
})

export const departSchema = Joi.object({
  kmDeparture: Joi.number().integer().min(0).required(),
})

export const returnSchema = Joi.object({
  kmReturn: Joi.number().integer().min(0).required(),
  leaksDetected: Joi.boolean().optional(),
  integrityVerified: Joi.boolean().optional(),
  result: Joi.string().valid('PASS', 'FAIL', 'WITH_OBSERVATIONS').required(),
  observations: Joi.string().allow('', null).optional(),
})
