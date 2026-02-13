// backend/src/features/inventory/items/catalogs/units/units.validation.ts

import Joi from 'joi'

export const createUnitSchema = Joi.object({
  code: Joi.string()
    .min(1)
    .max(10)
    .uppercase()
    .pattern(/^[A-Z0-9]+$/)
    .required()
    .messages({
      'string.empty': 'El código es requerido',
      'string.min': 'El código debe tener al menos 1 carácter',
      'string.max': 'El código no puede exceder 10 caracteres',
      'string.pattern.base':
        'El código solo puede contener letras mayúsculas y números',
      'any.required': 'El código es obligatorio',
    }),

  name: Joi.string().min(2).max(50).required().messages({
    'string.empty': 'El nombre es requerido',
    'string.min': 'El nombre debe tener al menos 2 caracteres',
    'string.max': 'El nombre no puede exceder 50 caracteres',
    'any.required': 'El nombre es obligatorio',
  }),

  abbreviation: Joi.string().min(1).max(10).required().messages({
    'string.empty': 'La abreviación es requerida',
    'string.min': 'La abreviación debe tener al menos 1 carácter',
    'string.max': 'La abreviación no puede exceder 10 caracteres',
    'any.required': 'La abreviación es obligatoria',
  }),

  type: Joi.string()
    .valid('COUNTABLE', 'WEIGHT', 'VOLUME', 'LENGTH')
    .required()
    .messages({
      'any.only': 'El tipo debe ser: COUNTABLE, WEIGHT, VOLUME o LENGTH',
      'any.required': 'El tipo es obligatorio',
    }),

  isActive: Joi.boolean().optional().default(true).messages({
    'boolean.base': 'isActive debe ser verdadero o falso',
  }),
})

export const updateUnitSchema = Joi.object({
  code: Joi.string()
    .min(1)
    .max(10)
    .uppercase()
    .pattern(/^[A-Z0-9]+$/)
    .optional()
    .messages({
      'string.min': 'El código debe tener al menos 1 carácter',
      'string.max': 'El código no puede exceder 10 caracteres',
      'string.pattern.base':
        'El código solo puede contener letras mayúsculas y números',
    }),

  name: Joi.string().min(2).max(50).optional().messages({
    'string.min': 'El nombre debe tener al menos 2 caracteres',
    'string.max': 'El nombre no puede exceder 50 caracteres',
  }),

  abbreviation: Joi.string().min(1).max(10).optional().messages({
    'string.min': 'La abreviación debe tener al menos 1 carácter',
    'string.max': 'La abreviación no puede exceder 10 caracteres',
  }),

  type: Joi.string()
    .valid('COUNTABLE', 'WEIGHT', 'VOLUME', 'LENGTH')
    .optional()
    .messages({
      'any.only': 'El tipo debe ser: COUNTABLE, WEIGHT, VOLUME o LENGTH',
    }),

  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'isActive debe ser verdadero o falso',
  }),
})
  .min(1)
  .messages({
    'object.min': 'Debe proporcionar al menos un campo para actualizar',
  })

export const unitIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'ID de unidad inválido',
    'any.required': 'El ID de la unidad es requerido',
  }),
})

export const getUnitsQuerySchema = Joi.object({
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

  type: Joi.string()
    .valid('COUNTABLE', 'WEIGHT', 'VOLUME', 'LENGTH')
    .optional()
    .messages({
      'any.only': 'El tipo debe ser: COUNTABLE, WEIGHT, VOLUME o LENGTH',
    }),

  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'isActive debe ser verdadero o falso',
  }),
})
