/**
 * Stock Validators - Specific validators for stock management
 */

import Joi from 'joi'
import { commonValidators } from './common.validator'

export const stockValidators = {
  /**
   * Create stock validation
   */
  createStock: Joi.object({
    itemId: commonValidators.itemId(true),
    warehouseId: commonValidators.warehouseId(true),
    quantityReal: commonValidators.quantity(0),
    quantityAvailable: commonValidators.quantity(0),
    quantityReserved: commonValidators.quantityOptional(0),
    minStock: commonValidators.quantityOptional(0),
    maxStock: commonValidators.quantityOptional(0),
    notes: commonValidators.notes(false),
  }),

  /**
   * Update stock validation
   */
  updateStock: Joi.object({
    quantityReal: commonValidators.quantityOptional(0),
    quantityAvailable: commonValidators.quantityOptional(0),
    quantityReserved: commonValidators.quantityOptional(0),
    minStock: commonValidators.quantityOptional(0),
    maxStock: commonValidators.quantityOptional(0),
    notes: commonValidators.notes(false),
  }).min(1),

  /**
   * Adjust stock validation
   */
  adjustStock: Joi.object({
    itemId: commonValidators.itemId(true),
    warehouseId: commonValidators.warehouseId(true),
    adjustment: Joi.number().integer().required().messages({
      'number.base': 'Adjustment must be a number',
      'number.integer': 'Adjustment must be a whole number',
      'any.required': 'Adjustment value is required',
    }),
    reason: Joi.string().max(500).required().messages({
      'string.max': 'Reason cannot exceed 500 characters',
      'any.required': 'Adjustment reason is required',
    }),
    notes: commonValidators.notes(false),
  }),

  /**
   * Reserve stock validation
   */
  reserveStock: Joi.object({
    itemId: commonValidators.itemId(true),
    warehouseId: commonValidators.warehouseId(false),
    quantity: commonValidators.quantity(1),
    referenceId: commonValidators.uuid(),
    reason: Joi.string().max(500).optional().messages({
      'string.max': 'Reason cannot exceed 500 characters',
    }),
  }),

  /**
   * Release reservation validation
   */
  releaseReservation: Joi.object({
    itemId: commonValidators.itemId(true),
    quantity: commonValidators.quantity(1),
    referenceId: commonValidators.uuid(),
    reason: Joi.string().max(500).optional().messages({
      'string.max': 'Reason cannot exceed 500 characters',
    }),
  }),

  /**
   * Stock reconciliation validation
   */
  reconciliation: Joi.object({
    itemId: commonValidators.itemId(true),
    warehouseId: commonValidators.warehouseId(true),
    countedQuantity: commonValidators.quantity(0),
    reason: Joi.string().max(500).optional().messages({
      'string.max': 'Reason cannot exceed 500 characters',
    }),
    notes: commonValidators.notes(false),
  }),

  /**
   * Stock query filters validation
   */
  filters: Joi.object({
    itemId: commonValidators.uuidOptional(),
    warehouseId: commonValidators.uuidOptional(),
    categoryId: commonValidators.uuidOptional(),
    status: Joi.string()
      .valid('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK')
      .optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50),
  }),

  /**
   * Reorder point calculation request
   */
  calculateReorderPoint: Joi.object({
    itemId: commonValidators.itemId(true),
    avgDailyDemand: commonValidators.price(0, true),
    leadTimeDays: Joi.number().integer().min(0).required().messages({
      'number.base': 'Lead time must be a number',
      'number.integer': 'Lead time must be a whole number (in days)',
      'number.min': 'Lead time must be 0 or more',
      'any.required': 'Lead time is required',
    }),
    safetyStockDays: Joi.number().integer().min(0).default(7).messages({
      'number.base': 'Safety stock days must be a number',
      'number.integer': 'Safety stock days must be a whole number',
      'number.min': 'Safety stock days must be 0 or more',
    }),
  }),

  /**
   * Bulk update min/max validation
   */
  bulkUpdateMinMax: Joi.object({
    items: Joi.array()
      .items(
        Joi.object({
          itemId: commonValidators.itemId(true),
          minStock: commonValidators.quantityOptional(0),
          maxStock: commonValidators.quantityOptional(0),
        })
      )
      .min(1)
      .required()
      .messages({
        'array.min': 'At least one item is required',
        'any.required': 'Items array is required',
      }),
  }),

  /**
   * Cycle count validation
   */
  cycleCount: Joi.object({
    itemId: commonValidators.itemId(true),
    warehouseId: commonValidators.warehouseId(true),
    countedQuantity: commonValidators.quantity(0),
    variance: Joi.number().allow(0, null).optional().messages({
      'number.base': 'Variance must be a number',
    }),
    notes: commonValidators.notes(false),
  }),
}

export default stockValidators
