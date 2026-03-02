// backend/src/features/inventory/suppliers/suppliers.validation.ts

import Joi from 'joi'

export const createSupplierSchema = Joi.object({
  code: Joi.string()
    .required()
    .max(50)
    .regex(/^[A-Z0-9_-]+$/)
    .messages({
      'string.required': 'code es requerido',
      'string.max': 'code no puede exceder 50 caracteres',
      'string.pattern.base':
        'code solo puede contener mayúsculas, números, guiones y guiones bajos',
    }),
  name: Joi.string().required().max(200).messages({
    'string.required': 'name es requerido',
    'string.max': 'name no puede exceder 200 caracteres',
  }),
  contactName: Joi.string().max(100).optional().allow(null).messages({
    'string.max': 'contactName no puede exceder 100 caracteres',
  }),
  email: Joi.string().email().max(100).optional().allow(null).messages({
    'string.email': 'email debe ser un correo válido',
    'string.max': 'email no puede exceder 100 caracteres',
  }),
  phone: Joi.string().max(20).optional().allow(null).messages({
    'string.max': 'phone no puede exceder 20 caracteres',
  }),
  address: Joi.string().max(300).optional().allow(null).messages({
    'string.max': 'address no puede exceder 300 caracteres',
  }),
  taxId: Joi.string().max(50).optional().allow(null).messages({
    'string.max': 'taxId no puede exceder 50 caracteres',
  }),
})

export const updateSupplierSchema = Joi.object({
  code: Joi.string()
    .max(50)
    .regex(/^[A-Z0-9_-]+$/)
    .optional()
    .messages({
      'string.max': 'code no puede exceder 50 caracteres',
      'string.pattern.base':
        'code solo puede contener mayúsculas, números, guiones y guiones bajos',
    }),
  name: Joi.string().max(200).optional().messages({
    'string.max': 'name no puede exceder 200 caracteres',
  }),
  contactName: Joi.string().max(100).optional().allow(null),
  email: Joi.string().email().max(100).optional().allow(null),
  phone: Joi.string().max(20).optional().allow(null),
  address: Joi.string().max(300).optional().allow(null),
  taxId: Joi.string().max(50).optional().allow(null),
  isActive: Joi.boolean().optional(),
}).min(1)
