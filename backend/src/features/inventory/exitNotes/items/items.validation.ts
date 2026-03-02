/**
 * Exit Notes Items Validation Schemas
 * Joi schemas for item picking and verification operations
 */

import Joi from 'joi'

/**
 * Pick items schema
 */
export const pickItemsSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        itemId: Joi.string().uuid().required().messages({
          'any.required': 'itemId is required',
          'string.guid': 'itemId must be a valid UUID',
        }),
        quantity: Joi.number().integer().min(1).required().messages({
          'any.required': 'quantity is required',
          'number.min': 'quantity must be at least 1',
        }),
        location: Joi.string().required().messages({
          'any.required': 'location is required for each item',
        }),
        batchId: Joi.string().uuid().optional().messages({
          'string.guid': 'batchId must be a valid UUID',
        }),
        serialNumberId: Joi.string().uuid().optional().messages({
          'string.guid': 'serialNumberId must be a valid UUID',
        }),
        notes: Joi.string().max(500).optional(),
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one item must be picked',
      'any.required': 'items array is required',
    }),
}).unknown(false)

/**
 * Verify items schema
 */
export const verifyItemsSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        itemId: Joi.string().uuid().required().messages({
          'any.required': 'itemId is required',
          'string.guid': 'itemId must be a valid UUID',
        }),
        quantityExpected: Joi.number().integer().min(1).required().messages({
          'any.required': 'quantityExpected is required',
          'number.min': 'quantityExpected must be at least 1',
        }),
        quantityFound: Joi.number().integer().min(0).required().messages({
          'any.required': 'quantityFound is required',
          'number.min': 'quantityFound cannot be negative',
        }),
        notes: Joi.string().max(500).optional(),
      })
    )
    .min(1)
    .required(),
  verifiedBy: Joi.string().uuid().required().messages({
    'any.required': 'verifiedBy is required',
  }),
}).unknown(false)

/**
 * Assign batch schema
 */
export const assignBatchSchema = Joi.object({
  itemId: Joi.string().uuid().required().messages({
    'any.required': 'itemId is required',
  }),
  batchId: Joi.string().uuid().required().messages({
    'any.required': 'batchId is required',
  }),
  quantity: Joi.number().integer().min(1).required(),
}).unknown(false)

/**
 * Assign serial schema
 */
export const assignSerialSchema = Joi.object({
  itemId: Joi.string().uuid().required(),
  serialNumberId: Joi.string().uuid().required(),
}).unknown(false)

/**
 * Remove item schema
 */
export const removeItemSchema = Joi.object({
  itemId: Joi.string().uuid().required().messages({
    'any.required': 'itemId is required',
    'string.guid': 'itemId must be a valid UUID',
  }),
}).unknown(false)

/**
 * Update item quantity schema
 */
export const updateItemQuantitySchema = Joi.object({
  quantity: Joi.number().integer().min(1).required().messages({
    'any.required': 'quantity is required',
    'number.min': 'quantity must be at least 1',
  }),
}).unknown(false)

/**
 * Exit note item ID schema
 */
export const exitNoteItemIdSchema = Joi.object({
  exitNoteId: Joi.string().uuid().required(),
  itemId: Joi.string().uuid().required(),
}).unknown(false)
