// backend/src/features/inventory/items/catalogs/categories/categories.validation.ts

import Joi from 'joi'

export const createCategorySchema = Joi.object({
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

  parentId: Joi.string().uuid().allow(null).optional().messages({
    'string.guid': 'ID de categoría padre inválido',
  }),

  defaultMargin: Joi.number().min(0).max(100).allow(null).optional().messages({
    'number.min': 'El margen debe ser mayor o igual a 0',
    'number.max': 'El margen no puede exceder 100%',
  }),

  isActive: Joi.boolean().optional().default(true).messages({
    'boolean.base': 'isActive debe ser verdadero o falso',
  }),
})

export const updateCategorySchema = Joi.object({
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

  parentId: Joi.string().uuid().allow(null).optional().messages({
    'string.guid': 'ID de categoría padre inválido',
  }),

  defaultMargin: Joi.number().min(0).max(100).allow(null).optional().messages({
    'number.min': 'El margen debe ser mayor o igual a 0',
    'number.max': 'El margen no puede exceder 100%',
  }),

  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'isActive debe ser verdadero o falso',
  }),
})
  .min(1)
  .messages({
    'object.min': 'Debe proporcionar al menos un campo para actualizar',
  })

export const categoryIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'ID de categoría inválido',
    'any.required': 'El ID de la categoría es requerido',
  }),
})

export const getCategoriesQuerySchema = Joi.object({
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

  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'isActive debe ser verdadero o falso',
  }),

  parentId: Joi.string().uuid().allow('null').optional().messages({
    'string.guid': 'ID de categoría padre inválido',
  }),

  hasParent: Joi.boolean().optional().messages({
    'boolean.base': 'hasParent debe ser verdadero o falso',
  }),
})
