// backend/src/features/inventory/items/catalogs/brands/brands.validation.ts

import Joi from 'joi'

export const createBrandSchema = Joi.object({
  code: Joi.string()
    .min(2)
    .max(20)
    .uppercase()
    .pattern(/^[A-Z0-9-]+$/)
    .required()
    .messages({
      'string.empty': 'El código es requerido',
      'string.min': 'El código debe tener al menos 2 caracteres',
      'string.max': 'El código no puede exceder 20 caracteres',
      'string.pattern.base':
        'El código solo puede contener letras mayúsculas, números y guiones',
      'any.required': 'El código es obligatorio',
    }),

  name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'El nombre es requerido',
    'string.min': 'El nombre debe tener al menos 2 caracteres',
    'string.max': 'El nombre no puede exceder 100 caracteres',
    'any.required': 'El nombre es obligatorio',
  }),

  description: Joi.string().max(500).allow('', null).optional().messages({
    'string.max': 'La descripción no puede exceder 500 caracteres',
  }),

  type: Joi.string().valid('VEHICLE', 'PART', 'BOTH').required().messages({
    'any.only':
      'El tipo debe ser: VEHICLE (vehículo), PART (producto/repuesto) o BOTH (ambos)',
    'any.required': 'El tipo es obligatorio',
  }),

  isActive: Joi.boolean().optional().default(true).messages({
    'boolean.base': 'isActive debe ser verdadero o falso',
  }),
})

export const updateBrandSchema = Joi.object({
  code: Joi.string()
    .min(2)
    .max(20)
    .uppercase()
    .pattern(/^[A-Z0-9-]+$/)
    .optional()
    .messages({
      'string.min': 'El código debe tener al menos 2 caracteres',
      'string.max': 'El código no puede exceder 20 caracteres',
      'string.pattern.base':
        'El código solo puede contener letras mayúsculas, números y guiones',
    }),

  name: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'El nombre debe tener al menos 2 caracteres',
    'string.max': 'El nombre no puede exceder 100 caracteres',
  }),

  description: Joi.string().max(500).allow('', null).optional().messages({
    'string.max': 'La descripción no puede exceder 500 caracteres',
  }),

  type: Joi.string().valid('VEHICLE', 'PART', 'BOTH').optional().messages({
    'any.only': 'El tipo debe ser: VEHICLE, PART o BOTH',
  }),

  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'isActive debe ser verdadero o falso',
  }),
})
  .min(1)
  .messages({
    'object.min': 'Debe proporcionar al menos un campo para actualizar',
  })

export const brandIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'ID de marca inválido',
    'any.required': 'El ID de la marca es requerido',
  }),
})

export const getBrandsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1).messages({
    'number.base': 'La página debe ser un número',
    'number.min': 'La página debe ser mayor a 0',
  }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(10)
    .messages({
      'number.base': 'El límite debe ser un número',
      'number.min': 'El límite debe ser mayor a 0',
      'number.max': 'El límite no puede exceder 100',
    }),

  search: Joi.string().max(100).optional().allow('').messages({
    'string.max': 'La búsqueda no puede exceder 100 caracteres',
  }),

  type: Joi.string().valid('VEHICLE', 'PART', 'BOTH').optional().messages({
    'any.only': 'El tipo debe ser: VEHICLE, PART o BOTH',
  }),

  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'isActive debe ser verdadero o falso',
  }),
})
