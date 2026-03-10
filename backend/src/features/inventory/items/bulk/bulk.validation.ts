// backend/src/features/inventory/items/bulk/bulk.validation.ts

import Joi from 'joi'

export const bulkImportSchema = Joi.object({
  fileName: Joi.string().max(255).required().messages({
    'string.max': 'File name cannot exceed 255 characters',
    'any.required': 'File name is required',
  }),
  fileContent: Joi.string().min(10).required().messages({
    'string.min': 'File content is too short',
    'any.required': 'File content is required',
  }),
  mapping: Joi.object().optional(),
  options: Joi.object({
    skipHeaderRow: Joi.boolean().optional(),
    updateExisting: Joi.boolean().optional(),
    validateOnly: Joi.boolean().optional(),
  }).optional(),
})

export const bulkExportSchema = Joi.object({
  filters: Joi.object({
    categoryId: Joi.string().uuid().optional(),
    brandId: Joi.string().uuid().optional(),
    minPrice: Joi.number().min(0).optional(),
    maxPrice: Joi.number().min(0).optional(),
    inStock: Joi.boolean().optional(),
    isActive: Joi.boolean().optional(),
    createdAfter: Joi.date().optional(),
    createdBefore: Joi.date().optional(),
  }).optional(),
  columns: Joi.array().items(Joi.string()).optional(),
  format: Joi.string().valid('csv', 'json', 'xlsx').optional().default('csv'),
})

export const bulkUpdateSchema = Joi.object({
  filter: Joi.object().required().messages({
    'any.required': 'Filter is required',
  }),
  update: Joi.object().required().messages({
    'any.required': 'Update object is required',
  }),
  options: Joi.object({
    validateOnly: Joi.boolean().optional(),
    skipValidation: Joi.boolean().optional(),
  }).optional(),
})

export const bulkDeleteSchema = Joi.object({
  filter: Joi.object().required().messages({
    'any.required': 'Filter is required',
  }),
  permanent: Joi.boolean().optional().default(false),
})

export const operationIdSchema = Joi.object({
  operationId: Joi.string().uuid().required().messages({
    'string.uuid': 'Operation ID must be a valid UUID',
    'any.required': 'Operation ID is required',
  }),
})

export const getPaginationSchema = Joi.object({
  page: Joi.string().pattern(/^\d+$/).optional().default('1'),
  limit: Joi.string().pattern(/^\d+$/).optional().default('10'),
})
