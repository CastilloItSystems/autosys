/**
 * Movement Validators - Specific validators for inventory movements
 */

import Joi from 'joi'
import { commonValidators } from './common.validator.js'

export const movementValidators = {
  /**
   * Create movement validation
   */
  createMovement: Joi.object({
    type: Joi.string()
      .valid(
        'PURCHASE_IN',
        'SALE',
        'TRANSFER_OUT',
        'TRANSFER_IN',
        'RETURN_IN',
        'RETURN_OUT',
        'WRITE_OFF',
        'ADJUSTMENT_IN',
        'ADJUSTMENT_OUT',
        'WORK_ORDER_CONSUMPTION'
      )
      .required()
      .messages({
        'any.only': 'Invalid movement type',
        'any.required': 'Movement type is required',
      }),
    itemId: commonValidators.itemId(true),
    quantity: commonValidators.quantity(1),
    fromWarehouseId: commonValidators.warehouseId(false),
    toWarehouseId: commonValidators.warehouseId(false),
    referenceId: commonValidators.uuidOptional(),
    notes: commonValidators.notes(false),
  }),

  /**
   * Transfer movement validation
   */
  transferMovement: Joi.object({
    itemId: commonValidators.itemId(true),
    quantity: commonValidators.quantity(1),
    fromWarehouseId: commonValidators.warehouseId(true),
    toWarehouseId: commonValidators.warehouseId(true),
    referenceId: commonValidators.uuidOptional(),
    notes: commonValidators.notes(false),
  }).custom((value, helpers) => {
    if (value.fromWarehouseId === value.toWarehouseId) {
      return helpers.error('any.invalid', {
        message: 'Source and destination warehouses must be different',
      })
    }
    return value
  }),

  /**
   * Stock adjustment validation
   */
  adjustment: Joi.object({
    type: Joi.string()
      .valid('ADJUSTMENT_IN', 'ADJUSTMENT_OUT')
      .required()
      .messages({
        'any.only': 'Type must be ADJUSTMENT_IN or ADJUSTMENT_OUT',
        'any.required': 'Type is required',
      }),
    itemId: commonValidators.itemId(true),
    quantity: commonValidators.quantity(1),
    warehouseId: commonValidators.warehouseId(true),
    reason: Joi.string().max(500).required().messages({
      'string.max': 'Reason cannot exceed 500 characters',
      'any.required': 'Reason is required',
    }),
    notes: commonValidators.notes(false),
  }),

  /**
   * Return validation
   */
  return: Joi.object({
    itemId: commonValidators.itemId(true),
    quantity: commonValidators.quantity(1),
    reason: Joi.string()
      .valid('DEFECTIVE', 'DAMAGED', 'WRONG_ITEM', 'UNWANTED', 'OTHER')
      .required()
      .messages({
        'any.only':
          'Reason must be: DEFECTIVE, DAMAGED, WRONG_ITEM, UNWANTED, or OTHER',
        'any.required': 'Return reason is required',
      }),
    referenceId: commonValidators.uuidOptional(),
    notes: commonValidators.notes(false),
  }),

  /**
   * Query filters validation
   */
  filters: Joi.object({
    itemId: commonValidators.uuidOptional(),
    warehouseId: commonValidators.uuidOptional(),
    type: Joi.string().optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().min(Joi.ref('startDate')).optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50),
  }),

  /**
   * Batch movement validation (multiple items)
   */
  batchMovement: Joi.object({
    type: Joi.string()
      .valid(
        'PURCHASE_IN',
        'SALE',
        'TRANSFER_OUT',
        'TRANSFER_IN',
        'ADJUSTMENT_IN',
        'ADJUSTMENT_OUT'
      )
      .required(),
    fromWarehouseId: commonValidators.warehouseId(false),
    toWarehouseId: commonValidators.warehouseId(false),
    movements: Joi.array()
      .items(
        Joi.object({
          itemId: commonValidators.itemId(true),
          quantity: commonValidators.quantity(1),
          referenceId: commonValidators.uuidOptional(),
        })
      )
      .min(1)
      .required()
      .messages({
        'array.min': 'At least one movement is required',
        'any.required': 'Movements are required',
      }),
    notes: commonValidators.notes(false),
  }),

  /**
   * Cost movement validation
   */
  costMovement: Joi.object({
    itemId: commonValidators.itemId(true),
    quantity: commonValidators.quantity(1),
    unitCost: commonValidators.price(0, true),
    warehouseId: commonValidators.warehouseId(true),
    notes: commonValidators.notes(false),
  }),
}

export default movementValidators
