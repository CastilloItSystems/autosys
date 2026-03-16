// backend/src/features/inventory/items/items.validation.ts

import Joi from 'joi'
import { REGEX_PATTERNS } from '../../../config/constants.js'

export const createItemSchema = Joi.object({
  sku: Joi.string()
    .min(3)
    .max(50)
    .uppercase()
    .pattern(REGEX_PATTERNS.SKU)
    .required()
    .messages({
      'string.empty': 'El SKU es requerido',
      'string.min': 'El SKU debe tener al menos 3 caracteres',
      'string.max': 'El SKU no puede exceder 50 caracteres',
      'string.pattern.base':
        'El SKU solo puede contener letras mayúsculas, números y guiones',
      'any.required': 'El SKU es obligatorio',
    }),
  code: Joi.string().min(3).max(50).required().messages({
    'string.empty': 'El código de producto es requerido',
    'string.min': 'El código de producto debe tener al menos 3 caracteres',
    'string.max': 'El código de producto no puede exceder 50 caracteres',
    'any.required': 'El código de producto es obligatorio',
  }),

  barcode: Joi.string().max(50).allow('', null).optional().messages({
    'string.max': 'El código de barras no puede exceder 50 caracteres',
  }),

  name: Joi.string().min(3).max(200).required().messages({
    'string.empty': 'El nombre es requerido',
    'string.min': 'El nombre debe tener al menos 3 caracteres',
    'string.max': 'El nombre no puede exceder 200 caracteres',
    'any.required': 'El nombre es obligatorio',
  }),

  description: Joi.string().max(2000).allow('', null).optional().messages({
    'string.max': 'La descripción no puede exceder 2000 caracteres',
  }),

  brandId: Joi.string().uuid().required().messages({
    'string.guid': 'ID de marca inválido',
    'any.required': 'La marca es requerida',
  }),

  categoryId: Joi.string().uuid().required().messages({
    'string.guid': 'ID de categoría inválido',
    'any.required': 'La categoría es requerida',
  }),

  modelId: Joi.string().uuid().allow(null).optional().messages({
    'string.guid': 'ID de modelo inválido',
  }),

  unitId: Joi.string().uuid().required().messages({
    'string.guid': 'ID de unidad inválido',
    'any.required': 'La unidad es requerida',
  }),

  location: Joi.string()
    .max(20)
    .uppercase()
    .pattern(REGEX_PATTERNS.LOCATION)
    .allow('', null)
    .optional()
    .messages({
      'string.max': 'La ubicación no puede exceder 20 caracteres',
      'string.pattern.base':
        'Formato de ubicación inválido (debe ser: M1-R01-D03)',
    }),

  costPrice: Joi.number().min(0).precision(2).required().messages({
    'number.min': 'El precio de costo debe ser mayor o igual a 0',
    'any.required': 'El precio de costo es requerido',
  }),

  salePrice: Joi.number().min(0).precision(2).required().messages({
    'number.min': 'El precio de venta debe ser mayor o igual a 0',
    'any.required': 'El precio de venta es requerido',
  }),

  wholesalePrice: Joi.number()
    .min(0)
    .precision(2)
    .allow(null)
    .optional()
    .messages({
      'number.min': 'El precio mayorista debe ser mayor o igual a 0',
    }),

  minStock: Joi.number().integer().min(0).optional().default(5).messages({
    'number.min': 'El stock mínimo debe ser mayor o igual a 0',
    'number.integer': 'El stock mínimo debe ser un número entero',
  }),

  maxStock: Joi.number()
    .integer()
    .min(0)
    .allow(null)
    .optional()
    .default(100)
    .messages({
      'number.min': 'El stock máximo debe ser mayor o igual a 0',
      'number.integer': 'El stock máximo debe ser un número entero',
    }),

  reorderPoint: Joi.number().integer().min(0).optional().default(10).messages({
    'number.min': 'El punto de reorden debe ser mayor o igual a 0',
    'number.integer': 'El punto de reorden debe ser un número entero',
  }),

  isActive: Joi.boolean().optional().default(true).messages({
    'boolean.base': 'isActive debe ser verdadero o falso',
  }),

  isSerialized: Joi.boolean().optional().default(false).messages({
    'boolean.base': 'isSerialized debe ser verdadero o falso',
  }),

  hasBatch: Joi.boolean().optional().default(false).messages({
    'boolean.base': 'hasBatch debe ser verdadero o falso',
  }),

  hasExpiry: Joi.boolean().optional().default(false).messages({
    'boolean.base': 'hasExpiry debe ser verdadero o falso',
  }),

  allowNegativeStock: Joi.boolean().optional().default(false).messages({
    'boolean.base': 'allowNegativeStock debe ser verdadero o falso',
  }),

  technicalSpecs: Joi.object().allow(null).optional().messages({
    'object.base': 'Las especificaciones técnicas deben ser un objeto válido',
  }),

  tags: Joi.array().items(Joi.string().max(50)).max(20).optional().messages({
    'array.base': 'Los tags deben ser un array',
    'array.max': 'No puede tener más de 20 tags',
    'string.max': 'Cada tag no puede exceder 50 caracteres',
  }),
}).custom((value, helpers) => {
  // Validar que salePrice sea mayor que costPrice
  if (value.salePrice < value.costPrice) {
    return helpers.error('any.invalid', {
      message: 'El precio de venta debe ser mayor o igual al precio de costo',
    })
  }

  // Validar que maxStock sea mayor que minStock
  if (value.maxStock && value.minStock && value.maxStock < value.minStock) {
    return helpers.error('any.invalid', {
      message: 'El stock máximo debe ser mayor que el stock mínimo',
    })
  }

  // Validar que reorderPoint esté entre minStock y maxStock
  if (value.reorderPoint < value.minStock) {
    return helpers.error('any.invalid', {
      message: 'El punto de reorden debe ser mayor o igual al stock mínimo',
    })
  }

  return value
})

export const updateItemSchema = Joi.object({
  sku: Joi.string()
    .min(3)
    .max(50)
    .uppercase()
    .pattern(REGEX_PATTERNS.SKU)
    .optional()
    .messages({
      'string.min': 'El SKU debe tener al menos 3 caracteres',
      'string.max': 'El SKU no puede exceder 50 caracteres',
      'string.pattern.base':
        'El SKU solo puede contener letras mayúsculas, números y guiones',
    }),
  code: Joi.string().min(3).max(50).optional().messages({
    'string.min': 'El código de producto debe tener al menos 3 caracteres',
    'string.max': 'El código de producto no puede exceder 50 caracteres',
  }),

  barcode: Joi.string().max(50).allow('', null).optional().messages({
    'string.max': 'El código de barras no puede exceder 50 caracteres',
  }),

  name: Joi.string().min(3).max(200).optional().messages({
    'string.min': 'El nombre debe tener al menos 3 caracteres',
    'string.max': 'El nombre no puede exceder 200 caracteres',
  }),

  description: Joi.string().max(2000).allow('', null).optional().messages({
    'string.max': 'La descripción no puede exceder 2000 caracteres',
  }),

  brandId: Joi.string().uuid().optional().messages({
    'string.guid': 'ID de marca inválido',
  }),

  categoryId: Joi.string().uuid().optional().messages({
    'string.guid': 'ID de categoría inválido',
  }),

  modelId: Joi.string().uuid().allow(null).optional().messages({
    'string.guid': 'ID de modelo inválido',
  }),

  unitId: Joi.string().uuid().optional().messages({
    'string.guid': 'ID de unidad inválido',
  }),

  location: Joi.string()
    .max(20)
    .uppercase()
    .pattern(REGEX_PATTERNS.LOCATION)
    .allow('', null)
    .optional()
    .messages({
      'string.max': 'La ubicación no puede exceder 20 caracteres',
      'string.pattern.base':
        'Formato de ubicación inválido (debe ser: M1-R01-D03)',
    }),

  costPrice: Joi.number().min(0).precision(2).optional().messages({
    'number.min': 'El precio de costo debe ser mayor o igual a 0',
  }),

  salePrice: Joi.number().min(0).precision(2).optional().messages({
    'number.min': 'El precio de venta debe ser mayor o igual a 0',
  }),

  wholesalePrice: Joi.number()
    .min(0)
    .precision(2)
    .allow(null)
    .optional()
    .messages({
      'number.min': 'El precio mayorista debe ser mayor o igual a 0',
    }),

  minStock: Joi.number().integer().min(0).optional().messages({
    'number.min': 'El stock mínimo debe ser mayor o igual a 0',
    'number.integer': 'El stock mínimo debe ser un número entero',
  }),

  maxStock: Joi.number().integer().min(0).allow(null).optional().messages({
    'number.min': 'El stock máximo debe ser mayor o igual a 0',
    'number.integer': 'El stock máximo debe ser un número entero',
  }),

  reorderPoint: Joi.number().integer().min(0).optional().messages({
    'number.min': 'El punto de reorden debe ser mayor o igual a 0',
    'number.integer': 'El punto de reorden debe ser un número entero',
  }),

  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'isActive debe ser verdadero o falso',
  }),

  isSerialized: Joi.boolean().optional().messages({
    'boolean.base': 'isSerialized debe ser verdadero o falso',
  }),

  hasBatch: Joi.boolean().optional().messages({
    'boolean.base': 'hasBatch debe ser verdadero o falso',
  }),

  hasExpiry: Joi.boolean().optional().messages({
    'boolean.base': 'hasExpiry debe ser verdadero o falso',
  }),

  allowNegativeStock: Joi.boolean().optional().messages({
    'boolean.base': 'allowNegativeStock debe ser verdadero o falso',
  }),

  technicalSpecs: Joi.object().allow(null).optional().messages({
    'object.base': 'Las especificaciones técnicas deben ser un objeto válido',
  }),

  tags: Joi.array().items(Joi.string().max(50)).max(20).optional().messages({
    'array.base': 'Los tags deben ser un array',
    'array.max': 'No puede tener más de 20 tags',
    'string.max': 'Cada tag no puede exceder 50 caracteres',
  }),
})
  .min(1)
  .messages({
    'object.min': 'Debe proporcionar al menos un campo para actualizar',
  })
  .custom((value, helpers) => {
    // Validar precios solo si ambos están presentes
    if (value.salePrice !== undefined && value.costPrice !== undefined) {
      if (value.salePrice < value.costPrice) {
        return helpers.error('any.invalid', {
          message:
            'El precio de venta debe ser mayor o igual al precio de costo',
        })
      }
    }

    // Validar stock solo si ambos están presentes
    if (value.maxStock !== undefined && value.minStock !== undefined) {
      if (value.maxStock < value.minStock) {
        return helpers.error('any.invalid', {
          message: 'El stock máximo debe ser mayor que el stock mínimo',
        })
      }
    }

    return value
  })

export const itemIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'ID de artículo inválido',
    'any.required': 'El ID del artículo es requerido',
  }),
})

export const getItemsQuerySchema = Joi.object({
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

  categoryId: Joi.string().uuid().optional().messages({
    'string.guid': 'ID de categoría inválido',
  }),

  modelId: Joi.string().uuid().optional().messages({
    'string.guid': 'ID de modelo inválido',
  }),

  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'isActive debe ser verdadero o falso',
  }),

  tags: Joi.alternatives()
    .try(Joi.string(), Joi.array().items(Joi.string()))
    .optional()
    .messages({
      'alternatives.types': 'Los tags deben ser un string o array de strings',
    }),

  minPrice: Joi.number().min(0).optional().messages({
    'number.min': 'El precio mínimo debe ser mayor o igual a 0',
  }),

  maxPrice: Joi.number().min(0).optional().messages({
    'number.min': 'El precio máximo debe ser mayor o igual a 0',
  }),

  inStock: Joi.boolean().optional().messages({
    'boolean.base': 'inStock debe ser verdadero o falso',
  }),

  lowStock: Joi.boolean().optional().messages({
    'boolean.base': 'lowStock debe ser verdadero o falso',
  }),

  sortBy: Joi.string()
    .valid(
      'name',
      'sku',
      'code',
      'salePrice',
      'costPrice',
      'createdAt',
      'updatedAt'
    )
    .optional()
    .default('name')
    .messages({
      'any.only':
        'sortBy debe ser uno de: name, sku, code, salePrice, costPrice, createdAt, updatedAt',
    }),

  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .optional()
    .default('asc')
    .messages({
      'any.only': 'sortOrder debe ser asc o desc',
    }),
})

export const updatePricingSchema = Joi.object({
  costPrice: Joi.number().min(0).precision(2).optional().messages({
    'number.min': 'El precio de costo debe ser mayor o igual a 0',
  }),

  salePrice: Joi.number().min(0).precision(2).optional().messages({
    'number.min': 'El precio de venta debe ser mayor o igual a 0',
  }),

  wholesalePrice: Joi.number()
    .min(0)
    .precision(2)
    .allow(null)
    .optional()
    .messages({
      'number.min': 'El precio mayorista debe ser mayor o igual a 0',
    }),

  applyMargin: Joi.boolean().optional().messages({
    'boolean.base': 'applyMargin debe ser verdadero o falso',
  }),

  marginPercentage: Joi.number().min(0).max(1000).optional().messages({
    'number.min': 'El margen debe ser mayor o igual a 0',
    'number.max': 'El margen no puede exceder 1000%',
  }),
})
  .min(1)
  .messages({
    'object.min': 'Debe proporcionar al menos un campo para actualizar',
  })

export const bulkUpdateSchema = Joi.object({
  itemIds: Joi.array().items(Joi.string().uuid()).min(1).required().messages({
    'array.min': 'Debe proporcionar al menos un artículo',
    'any.required': 'Los IDs de artículos son requeridos',
  }),

  updates: Joi.object({
    categoryId: Joi.string().uuid().optional(),
    isActive: Joi.boolean().optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    applyPriceIncrease: Joi.number().min(-100).max(1000).optional(),
  })
    .min(1)
    .required()
    .messages({
      'object.min': 'Debe proporcionar al menos un campo para actualizar',
      'any.required': 'Las actualizaciones son requeridas',
    }),
})

export const addImageSchema = Joi.object({
  url: Joi.string().uri().required().messages({
    'string.uri': 'URL de imagen inválida',
    'any.required': 'La URL es requerida',
  }),

  isPrimary: Joi.boolean().optional().default(false).messages({
    'boolean.base': 'isPrimary debe ser verdadero o falso',
  }),

  order: Joi.number().integer().min(0).optional().default(0).messages({
    'number.integer': 'El orden debe ser un número entero',
    'number.min': 'El orden debe ser mayor o igual a 0',
  }),
})

export const bulkCreateSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        sku: Joi.string()
          .min(3)
          .max(50)
          .uppercase()
          .pattern(REGEX_PATTERNS.SKU)
          .required()
          .messages({
            'string.empty': 'El SKU es requerido',
            'string.min': 'El SKU debe tener al menos 3 caracteres',
            'string.max': 'El SKU no puede exceder 50 caracteres',
            'string.pattern.base':
              'El SKU solo puede contener letras mayúsculas, números y guiones',
            'any.required': 'El SKU es obligatorio',
          }),
        name: Joi.string().min(3).max(200).required().messages({
          'string.empty': 'El nombre es requerido',
          'string.min': 'El nombre debe tener al menos 3 caracteres',
          'string.max': 'El nombre no puede exceder 200 caracteres',
          'any.required': 'El nombre es obligatorio',
        }),
        brandId: Joi.string().uuid().required().messages({
          'string.guid': 'ID de marca inválido',
          'any.required': 'La marca es requerida',
        }),
        categoryId: Joi.string().uuid().required().messages({
          'string.guid': 'ID de categoría inválido',
          'any.required': 'La categoría es requerida',
        }),
        unitId: Joi.string().uuid().required().messages({
          'string.guid': 'ID de unidad inválido',
          'any.required': 'La unidad es requerida',
        }),
        costPrice: Joi.number().min(0).precision(2).required().messages({
          'number.min': 'El precio de costo debe ser mayor o igual a 0',
          'any.required': 'El precio de costo es requerido',
        }),
        salePrice: Joi.number().min(0).precision(2).required().messages({
          'number.min': 'El precio de venta debe ser mayor o igual a 0',
          'any.required': 'El precio de venta es requerido',
        }),
        minStock: Joi.number().integer().min(0).optional().default(5).messages({
          'number.min': 'El stock mínimo debe ser mayor o igual a 0',
          'number.integer': 'El stock mínimo debe ser un número entero',
        }),
        reorderPoint: Joi.number()
          .integer()
          .min(0)
          .optional()
          .default(10)
          .messages({
            'number.min': 'El punto de reorden debe ser mayor o igual a 0',
            'number.integer': 'El punto de reorden debe ser un número entero',
          }),
      })
    )
    .min(1)
    .max(100)
    .required()
    .messages({
      'array.min': 'Debe proporcionar al menos un artículo',
      'array.max': 'No puede crear más de 100 artículos a la vez',
      'any.required': 'El array de artículos es requerido',
    }),
})

export const generateSkuSchema = Joi.object({
  brandId: Joi.string().uuid().required().messages({
    'string.guid': 'ID de marca inválido',
    'any.required': 'El ID de marca es requerido',
  }),
  categoryId: Joi.string().uuid().required().messages({
    'string.guid': 'ID de categoría inválido',
    'any.required': 'El ID de categoría es requerido',
  }),
})

export const checkAvailabilitySchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        sku: Joi.string().required().messages({
          'any.required': 'El SKU es requerido',
        }),
        quantity: Joi.number().positive().required().messages({
          'number.positive': 'La cantidad debe ser mayor a 0',
          'any.required': 'La cantidad es requerida',
        }),
      })
    )
    .required()
    .messages({
      'any.required': 'El array de artículos es requerido',
    }),
})
