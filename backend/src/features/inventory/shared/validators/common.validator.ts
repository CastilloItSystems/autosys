/**
 * Common Inventory Validators
 */

import Joi from 'joi'

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const commonValidators = {
  /**
   * UUID validation with custom error message
   */
  uuid: () =>
    Joi.string().regex(uuidPattern).required().messages({
      'string.pattern.base': 'Invalid UUID format',
      'any.required': 'ID is required',
    }),

  /**
   * Optional UUID validation
   */
  uuidOptional: () =>
    Joi.string().regex(uuidPattern).optional().messages({
      'string.pattern.base': 'Invalid UUID format',
    }),

  /**
   * Quantity validation (positive integer)
   */
  quantity: (min: number = 1, max: number = 999999) =>
    Joi.number()
      .integer()
      .min(min)
      .max(max)
      .required()
      .messages({
        'number.base': 'Quantity must be a number',
        'number.integer': 'Quantity must be a whole number',
        'number.min': `Quantity must be at least ${min}`,
        'number.max': `Quantity cannot exceed ${max}`,
        'any.required': 'Quantity is required',
      }),

  /**
   * Optional quantity validation
   */
  quantityOptional: (min: number = 0, max: number = 999999) =>
    Joi.number()
      .integer()
      .min(min)
      .max(max)
      .optional()
      .messages({
        'number.base': 'Quantity must be a number',
        'number.integer': 'Quantity must be a whole number',
        'number.min': `Quantity must be at least ${min}`,
        'number.max': `Quantity cannot exceed ${max}`,
      }),

  /**
   * Pagination validation
   */
  pagination: () =>
    Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(50),
    }),

  /**
   * Date range validation
   */
  dateRange: () =>
    Joi.object({
      startDate: Joi.date().optional(),
      endDate: Joi.date().min(Joi.ref('startDate')).optional(),
    }),

  /**
   * Notes field validation
   */
  notes: (required: boolean = false) =>
    required
      ? Joi.string().max(1000).required().messages({
          'string.max': 'Notes cannot exceed 1000 characters',
          'any.required': 'Notes are required',
        })
      : Joi.string().max(1000).optional().messages({
          'string.max': 'Notes cannot exceed 1000 characters',
        }),

  /**
   * Status enum validation
   */
  status: (allowedStatuses: string[]) =>
    Joi.string()
      .valid(...allowedStatuses)
      .required()
      .messages({
        'any.only': `Status must be one of: ${allowedStatuses.join(', ')}`,
        'any.required': 'Status is required',
      }),

  /**
   * Warehouse ID validation
   */
  warehouseId: (required: boolean = true) =>
    required
      ? Joi.string().regex(uuidPattern).required().messages({
          'string.pattern.base': 'Invalid warehouse ID format',
          'any.required': 'Warehouse ID is required',
        })
      : Joi.string().regex(uuidPattern).optional().messages({
          'string.pattern.base': 'Invalid warehouse ID format',
        }),

  /**
   * Item ID validation
   */
  itemId: (required: boolean = true) =>
    required
      ? Joi.string().regex(uuidPattern).required().messages({
          'string.pattern.base': 'Invalid item ID format',
          'any.required': 'Item ID is required',
        })
      : Joi.string().regex(uuidPattern).optional().messages({
          'string.pattern.base': 'Invalid item ID format',
        }),

  /**
   * Price validation
   */
  price: (min: number = 0, required: boolean = false) =>
    required
      ? Joi.number()
          .min(min)
          .precision(2)
          .required()
          .messages({
            'number.base': 'Price must be a number',
            'number.min': `Price must be at least ${min}`,
            'any.required': 'Price is required',
          })
      : Joi.number()
          .min(min)
          .precision(2)
          .optional()
          .messages({
            'number.base': 'Price must be a number',
            'number.min': `Price must be at least ${min}`,
          }),

  /**
   * Email validation
   */
  email: (required: boolean = false) =>
    required
      ? Joi.string().email().required().messages({
          'string.email': 'Invalid email format',
          'any.required': 'Email is required',
        })
      : Joi.string().email().optional().messages({
          'string.email': 'Invalid email format',
        }),

  /**
   * SKU validation
   */
  sku: (required: boolean = true) =>
    required
      ? Joi.string().alphanum().min(3).max(50).required().messages({
          'string.alphanum': 'SKU must contain only alphanumeric characters',
          'string.min': 'SKU must be at least 3 characters',
          'string.max': 'SKU cannot exceed 50 characters',
          'any.required': 'SKU is required',
        })
      : Joi.string().alphanum().min(3).max(50).optional().messages({
          'string.alphanum': 'SKU must contain only alphanumeric characters',
          'string.min': 'SKU must be at least 3 characters',
          'string.max': 'SKU cannot exceed 50 characters',
        }),

  /**
   * Percentage validation (0-100)
   */
  percentage: (required: boolean = false) =>
    required
      ? Joi.number().min(0).max(100).required().messages({
          'number.base': 'Percentage must be a number',
          'number.min': 'Percentage must be at least 0',
          'number.max': 'Percentage cannot exceed 100',
          'any.required': 'Percentage is required',
        })
      : Joi.number().min(0).max(100).optional().messages({
          'number.base': 'Percentage must be a number',
          'number.min': 'Percentage must be at least 0',
          'number.max': 'Percentage cannot exceed 100',
        }),
}

export default commonValidators
