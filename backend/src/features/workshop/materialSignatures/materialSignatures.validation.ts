// backend/src/features/workshop/materialSignatures/materialSignatures.validation.ts
import Joi from 'joi'

export const createMaterialSignatureSchema = Joi.object({
  materialId: Joi.string().required().messages({
    'any.required': 'El material es obligatorio',
  }),
  signerRole: Joi.string()
    .valid('STOREKEEPER', 'SHOP_FOREMAN', 'ADVISOR', 'TECHNICIAN')
    .required()
    .messages({
      'any.required': 'El rol del firmante es obligatorio',
      'any.only': 'Rol no válido',
    }),
  signerId: Joi.string().required().messages({
    'any.required': 'El firmante es obligatorio',
  }),
  signerName: Joi.string().allow('', null).optional(),
  signatureUrl: Joi.string().allow('', null).optional(),
  notes: Joi.string().allow('', null).optional(),
})
