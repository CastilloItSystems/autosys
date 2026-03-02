// backend/src/features/inventory/warehouses/warehouses.validation.ts

import Joi from 'joi'
import { REGEX_PATTERNS } from '../../../config/constants'

export const createWarehouseSchema = Joi.object({
  code: Joi.string()
    .min(2)
    .max(50)
    .uppercase()
    .pattern(REGEX_PATTERNS.SKU)
    .required()
    .messages({
      'string.empty': 'El código de almacén es requerido',
      'string.min': 'El código debe tener al menos 2 caracteres',
      'string.max': 'El código no puede exceder 50 caracteres',
      'string.pattern.base':
        'El código solo puede contener letras mayúsculas, números y guiones',
      'any.required': 'El código es obligatorio',
    }),

  name: Joi.string().min(3).max(200).required().messages({
    'string.empty': 'El nombre del almacén es requerido',
    'string.min': 'El nombre debe tener al menos 3 caracteres',
    'string.max': 'El nombre no puede exceder 200 caracteres',
    'any.required': 'El nombre es obligatorio',
  }),

  type: Joi.string()
    .valid('PRINCIPAL', 'SUCURSAL', 'TRANSITO')
    .optional()
    .default('PRINCIPAL')
    .messages({
      'any.only': 'El tipo debe ser uno de: PRINCIPAL, SUCURSAL, TRANSITO',
    }),

  address: Joi.string().max(500).allow('', null).optional().messages({
    'string.max': 'La dirección no puede exceder 500 caracteres',
  }),

  isActive: Joi.boolean().optional().default(true),
})

export const updateWarehouseSchema = Joi.object({
  code: Joi.string()
    .min(2)
    .max(50)
    .uppercase()
    .pattern(REGEX_PATTERNS.SKU)
    .optional()
    .messages({
      'string.min': 'El código debe tener al menos 2 caracteres',
      'string.max': 'El código no puede exceder 50 caracteres',
      'string.pattern.base':
        'El código solo puede contener letras mayúsculas, números y guiones',
    }),

  name: Joi.string().min(3).max(200).optional().messages({
    'string.min': 'El nombre debe tener al menos 3 caracteres',
    'string.max': 'El nombre no puede exceder 200 caracteres',
  }),

  type: Joi.string()
    .valid('PRINCIPAL', 'SUCURSAL', 'TRANSITO')
    .optional()
    .messages({
      'any.only': 'El tipo debe ser uno de: PRINCIPAL, SUCURSAL, TRANSITO',
    }),

  address: Joi.string().max(500).allow('', null).optional().messages({
    'string.max': 'La dirección no puede exceder 500 caracteres',
  }),

  isActive: Joi.boolean().optional(),
})
  .min(1)
  .messages({
    'object.min': 'Debe proporcionar al menos un campo para actualizar',
  })
