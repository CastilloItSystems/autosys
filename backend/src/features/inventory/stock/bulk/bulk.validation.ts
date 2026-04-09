// backend/src/features/inventory/stock/bulk/bulk.validation.ts

import Joi from 'joi'

export const stockBulkImportSchema = Joi.object({
  fileName: Joi.string().max(255).required(),
  fileContent: Joi.string().min(10).required(),
  options: Joi.object({
    updateExisting: Joi.boolean().optional(),
  }).optional(),
})

export const stockBulkAdjustmentSchema = Joi.object({
  fileName: Joi.string().max(255).required(),
  fileContent: Joi.string().min(10).required(),
})

export const stockBulkTransferSchema = Joi.object({
  fileName: Joi.string().max(255).required(),
  fileContent: Joi.string().min(10).required(),
})

export const stockBulkExportSchema = Joi.object({
  filters: Joi.object({
    warehouseId: Joi.string().uuid().optional(),
    itemId: Joi.string().uuid().optional(),
    categoryId: Joi.string().uuid().optional(),
    minQuantity: Joi.number().min(0).optional(),
    maxQuantity: Joi.number().min(0).optional(),
    lowStock: Joi.boolean().optional(),
    outOfStock: Joi.boolean().optional(),
  }).optional(),
  columns: Joi.array().items(Joi.string()).optional(),
  format: Joi.string().valid('csv', 'json', 'xlsx').optional().default('csv'),
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
