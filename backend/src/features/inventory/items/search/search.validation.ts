// backend/src/features/inventory/items/search/search.validation.ts

import Joi from 'joi'

export const searchSchema = Joi.object({
  query: Joi.string().min(1).required().messages({
    'string.empty': 'Query de búsqueda no puede estar vacía',
    'any.required': 'Query de búsqueda es requerida',
  }),
  filters: Joi.object({
    categoryId: Joi.string().uuid().optional(),
    brandId: Joi.string().uuid().optional(),
    minPrice: Joi.number().min(0).optional(),
    maxPrice: Joi.number().min(0).optional(),
    inStock: Joi.boolean().optional(),
    isActive: Joi.boolean().optional(),
    tags: Joi.array().items(Joi.string()).optional(),
  }).optional(),
  sortBy: Joi.string().valid('relevance', 'name', 'price', 'newest').optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional(),
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(10),
})

export const advancedSearchSchema = searchSchema.keys({
  filters: Joi.object({
    categoryId: Joi.string().uuid().optional(),
    brandId: Joi.string().uuid().optional(),
    minPrice: Joi.number().min(0).optional(),
    maxPrice: Joi.number().min(0).optional(),
    inStock: Joi.boolean().optional(),
    isActive: Joi.boolean().optional(),
    tags: Joi.array().items(Joi.string()).optional(),
  }).optional(),
})

export const suggestionsSchema = Joi.object({
  query: Joi.string().min(2).required().messages({
    'string.min': 'Query debe tener al menos 2 caracteres',
    'any.required': 'Query es requerida',
  }),
  limit: Joi.string().pattern(/^\d+$/).optional().default('10'),
})

export const aggregationsSchema = Joi.object({
  query: Joi.string().optional(),
})

// Search Index Schemas
export const createSearchIndexSchema = Joi.object({
  itemId: Joi.string().uuid().required().messages({
    'string.uuid': 'ID del artículo debe ser un UUID válido',
    'any.required': 'ID del artículo es requerido',
  }),
  content: Joi.string().min(1).required().messages({
    'string.empty': 'Contenido no puede estar vacío',
    'any.required': 'Contenido es requerido',
  }),
  keywords: Joi.array().items(Joi.string()).optional(),
})

export const updateSearchIndexSchema = Joi.object({
  content: Joi.string().min(1).optional(),
  keywords: Joi.array().items(Joi.string()).optional(),
})

export const itemIdSchema = Joi.object({
  itemId: Joi.string().uuid().required().messages({
    'string.uuid': 'ID del artículo debe ser un UUID válido',
    'any.required': 'ID del artículo es requerido',
  }),
})

export const getSearchIndexFiltersSchema = Joi.object({
  itemId: Joi.string().uuid().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  page: Joi.string().pattern(/^\d+$/).optional().default('1'),
  limit: Joi.string().pattern(/^\d+$/).optional().default('10'),
})
