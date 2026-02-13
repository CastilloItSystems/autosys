// backend/src/features/inventory/items/catalogs/models/models.validation.ts

import Joi from 'joi'

const currentYear = new Date().getFullYear()

export const createModelSchema = Joi.object({
  brandId: Joi.string().uuid().required().messages({
    'string.guid': 'ID de marca inválido',
    'any.required': 'La marca es requerida',
  }),

  code: Joi.string().max(50).optional().allow(null).messages({
    'string.max': 'El código no puede exceder 50 caracteres',
  }),

  name: Joi.string().min(1).max(100).required().messages({
    'string.empty': 'El nombre es requerido',
    'string.min': 'El nombre debe tener al menos 1 carácter',
    'string.max': 'El nombre no puede exceder 100 caracteres',
    'any.required': 'El nombre es obligatorio',
  }),

  year: Joi.number()
    .integer()
    .min(1900)
    .max(currentYear + 2)
    .allow(null)
    .optional()
    .messages({
      'number.min': 'El año debe ser mayor o igual a 1900',
      'number.max': `El año no puede exceder ${currentYear + 2}`,
      'number.integer': 'El año debe ser un número entero',
    }),

  type: Joi.string()
    .valid('VEHICLE', 'PART', 'GENERIC')
    .optional()
    .default('PART')
    .messages({
      'any.only': 'El tipo debe ser VEHICLE, PART o GENERIC',
    }),

  description: Joi.string().max(500).optional().allow(null).messages({
    'string.max': 'La descripción no puede exceder 500 caracteres',
  }),

  specifications: Joi.object().optional().allow(null),

  isActive: Joi.boolean().optional().default(true).messages({
    'boolean.base': 'isActive debe ser verdadero o falso',
  }),
})

export const updateModelSchema = Joi.object({
  brandId: Joi.string().uuid().optional().messages({
    'string.guid': 'ID de marca inválido',
  }),

  code: Joi.string().max(50).optional().allow(null).messages({
    'string.max': 'El código no puede exceder 50 caracteres',
  }),

  name: Joi.string().min(1).max(100).optional().messages({
    'string.min': 'El nombre debe tener al menos 1 carácter',
    'string.max': 'El nombre no puede exceder 100 caracteres',
  }),

  year: Joi.number()
    .integer()
    .min(1900)
    .max(currentYear + 2)
    .allow(null)
    .optional()
    .messages({
      'number.min': 'El año debe ser mayor o igual a 1900',
      'number.max': `El año no puede exceder ${currentYear + 2}`,
      'number.integer': 'El año debe ser un número entero',
    }),

  type: Joi.string().valid('VEHICLE', 'PART', 'GENERIC').optional().messages({
    'any.only': 'El tipo debe ser VEHICLE, PART o GENERIC',
  }),

  description: Joi.string().max(500).optional().allow(null).messages({
    'string.max': 'La descripción no puede exceder 500 caracteres',
  }),

  specifications: Joi.object().optional().allow(null),

  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'isActive debe ser verdadero o falso',
  }),
})
  .min(1)
  .messages({
    'object.min': 'Debe proporcionar al menos un campo para actualizar',
  })

export const modelIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'ID de modelo inválido',
    'any.required': 'El ID del modelo es requerido',
  }),
})

export const getModelsQuerySchema = Joi.object({
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

  brandId: Joi.string().uuid().optional().messages({
    'string.guid': 'ID de marca inválido',
  }),

  year: Joi.number()
    .integer()
    .min(1900)
    .max(currentYear + 2)
    .optional()
    .messages({
      'number.min': 'El año debe ser mayor o igual a 1900',
      'number.max': `El año no puede exceder ${currentYear + 2}`,
    }),

  type: Joi.string().valid('VEHICLE', 'PART', 'GENERIC').optional().messages({
    'any.only': 'El tipo debe ser VEHICLE, PART o GENERIC',
  }),

  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'isActive debe ser verdadero o falso',
  }),
})

export const getModelsByBrandSchema = Joi.object({
  brandId: Joi.string().uuid().required().messages({
    'string.guid': 'ID de marca inválido',
    'any.required': 'El ID de la marca es requerido',
  }),
})
