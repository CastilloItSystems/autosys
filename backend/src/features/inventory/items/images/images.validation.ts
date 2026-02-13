// backend/src/features/inventory/items/images/images.validation.ts

import Joi from 'joi'

export const createImageSchema = Joi.object({
  itemId: Joi.string().uuid().required().messages({
    'string.uuid': 'ID del artículo debe ser un UUID válido',
    'any.required': 'ID del artículo es requerido',
  }),
  url: Joi.string().uri().required().messages({
    'string.uri': 'URL debe ser válida',
    'any.required': 'URL es requerida',
  }),
  fileName: Joi.string().max(255).required().messages({
    'string.max': 'Nombre del archivo no puede exceder 255 caracteres',
    'any.required': 'Nombre del archivo es requerido',
  }),
  mimeType: Joi.string().max(100).required().messages({
    'string.max': 'Tipo MIME no puede exceder 100 caracteres',
    'any.required': 'Tipo MIME es requerido',
  }),
  size: Joi.number().integer().positive().required().messages({
    'number.positive': 'Tamaño debe ser un número positivo',
    'any.required': 'Tamaño es requerido',
  }),
  width: Joi.number().integer().positive().optional().messages({
    'number.positive': 'Ancho debe ser un número positivo',
  }),
  height: Joi.number().integer().positive().optional().messages({
    'number.positive': 'Alto debe ser un número positivo',
  }),
  altText: Joi.string().max(500).optional().allow('').messages({
    'string.max': 'Texto alternativo no puede exceder 500 caracteres',
  }),
  caption: Joi.string().max(500).optional().allow('').messages({
    'string.max': 'Descripción no puede exceder 500 caracteres',
  }),
  displayOrder: Joi.number().integer().min(0).optional().messages({
    'number.min': 'Orden de visualización no puede ser negativo',
  }),
  isPrimary: Joi.boolean().optional().messages({
    'boolean.base': 'isPrimary debe ser verdadero o falso',
  }),
})

export const updateImageSchema = Joi.object({
  altText: Joi.string().max(500).optional().allow('').messages({
    'string.max': 'Texto alternativo no puede exceder 500 caracteres',
  }),
  caption: Joi.string().max(500).optional().allow('').messages({
    'string.max': 'Descripción no puede exceder 500 caracteres',
  }),
  displayOrder: Joi.number().integer().min(0).optional().messages({
    'number.min': 'Orden de visualización no puede ser negativo',
  }),
  isPrimary: Joi.boolean().optional().messages({
    'boolean.base': 'isPrimary debe ser verdadero o falso',
  }),
  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'isActive debe ser verdadero o falso',
  }),
})

export const imageIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.uuid': 'ID de imagen debe ser un UUID válido',
    'any.required': 'ID de imagen es requerido',
  }),
})

export const itemIdSchema = Joi.object({
  itemId: Joi.string().uuid().required().messages({
    'string.uuid': 'ID del artículo debe ser un UUID válido',
    'any.required': 'ID del artículo es requerido',
  }),
})

export const getImageFiltersSchema = Joi.object({
  itemId: Joi.string().uuid().optional().messages({
    'string.uuid': 'ID del artículo debe ser un UUID válido',
  }),
  isPrimary: Joi.string().valid('true', 'false').optional().messages({
    'any.only': 'isPrimary debe ser true o false',
  }),
  isActive: Joi.string().valid('true', 'false').optional().messages({
    'any.only': 'isActive debe ser true o false',
  }),
  page: Joi.string().pattern(/^\d+$/).optional().default('1').messages({
    'string.pattern.base': 'Página debe ser un número válido',
  }),
  limit: Joi.string().pattern(/^\d+$/).optional().default('10').messages({
    'string.pattern.base': 'Límite debe ser un número válido',
  }),
})
