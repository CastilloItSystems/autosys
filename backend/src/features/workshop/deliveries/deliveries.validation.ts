// backend/src/features/workshop/deliveries/deliveries.validation.ts
import Joi from 'joi'

export const createDeliverySchema = Joi.object({
  serviceOrderId: Joi.string()
    .required()
    .messages({ 'any.required': 'La orden de servicio es requerida' }),
  deliveredBy: Joi.string().optional(),
  receivedByName: Joi.string().trim().max(150).optional().allow(''),
  clientConformity: Joi.boolean().optional().default(true),
  clientSignature: Joi.string().trim().optional().allow(''),
  observations: Joi.string().trim().max(1000).optional().allow(''),
  nextVisitDate: Joi.date().iso().optional(),
})
