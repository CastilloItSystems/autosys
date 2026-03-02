/**
 * Exit Notes Module Validation Schemas
 * Joi schemas for request validation with type-specific rules
 */

import Joi from 'joi'
import { ExitNoteType } from './exitNotes.interface'

/**
 * Base item schema for all exit notes
 */
const baseItemSchema = Joi.object({
  itemId: Joi.string().uuid().required().messages({
    'any.required': 'itemId is required',
    'string.guid': 'itemId must be a valid UUID',
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    'any.required': 'quantity is required',
    'number.min': 'quantity must be at least 1',
  }),
  pickedFromLocation: Joi.string().optional(),
  batchId: Joi.string().uuid().optional(),
  serialNumberId: Joi.string().uuid().optional(),
  notes: Joi.string().optional().max(500),
})

/**
 * Create Exit Note Schema
 * Validates based on exit type with conditional field requirements
 */
export const createExitNoteSchema = Joi.object({
  type: Joi.string()
    .valid(...Object.values(ExitNoteType))
    .required()
    .messages({
      'any.required': 'type is required',
      'any.only': `type must be one of: ${Object.values(ExitNoteType).join(', ')}`,
    }),

  warehouseId: Joi.string().uuid().required().messages({
    'any.required': 'warehouseId is required',
    'string.guid': 'warehouseId must be a valid UUID',
  }),

  // SALE: requires preInvoiceId
  preInvoiceId: Joi.string()
    .uuid()
    .when('type', {
      is: ExitNoteType.SALE,
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .messages({
      'any.required': 'preInvoiceId is required for SALE exits',
      'string.guid': 'preInvoiceId must be a valid UUID',
    }),

  // Recipient information (optional for INTERNAL_USE, SAMPLE, TRANSFER)
  recipientName: Joi.string()
    .max(255)
    .when('type', {
      is: Joi.alternatives().try(
        ExitNoteType.INTERNAL_USE,
        ExitNoteType.SAMPLE,
        ExitNoteType.TRANSFER
      ),
      then: Joi.optional(),
      otherwise: Joi.optional(),
    }),

  recipientId: Joi.string().max(50).optional().messages({
    'string.max':
      'recipientId must not exceed 50 characters (e.g., RIF, Cédula)',
  }),

  recipientPhone: Joi.string().max(20).optional().messages({
    'string.max': 'recipientPhone must not exceed 20 characters',
  }),

  // Reason/reference
  reason: Joi.string()
    .max(500)
    .when('type', {
      is: ExitNoteType.OTHER,
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .messages({
      'any.required': 'reason is required for OTHER type exits',
    }),

  reference: Joi.string().max(100).optional().messages({
    'string.max': 'reference must not exceed 100 characters',
  }),

  // LOAN: requires expectedReturnDate
  expectedReturnDate: Joi.date()
    .when('type', {
      is: ExitNoteType.LOAN,
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .messages({
      'any.required': 'expectedReturnDate is required for LOAN exits',
      'date.base': 'expectedReturnDate must be a valid date',
    }),

  // Items
  items: Joi.array().items(baseItemSchema).min(1).required().messages({
    'array.base': 'items must be an array',
    'array.min': 'at least 1 item is required',
    'any.required': 'items array is required',
  }),

  notes: Joi.string().max(1000).optional(),

  // Authorization
  authorizedBy: Joi.string()
    .uuid()
    .when('type', {
      is: Joi.alternatives().try(
        ExitNoteType.DONATION,
        ExitNoteType.OWNER_PICKUP
      ),
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .messages({
      'any.required':
        'authorizedBy is required for DONATION or OWNER_PICKUP exits',
    }),
})

/**
 * Update Exit Note Schema
 * Allows partial updates when in PENDING or IN_PROGRESS status
 */
export const updateExitNoteSchema = Joi.object({
  recipientName: Joi.string().max(255).optional(),
  recipientId: Joi.string().max(50).optional(),
  recipientPhone: Joi.string().max(20).optional(),
  reason: Joi.string().max(500).optional(),
  reference: Joi.string().max(100).optional(),
  notes: Joi.string().max(1000).optional(),
  expectedReturnDate: Joi.date().optional(),
})

/**
 * Mark As Ready Schema
 * Transition to READY status
 */
export const markAsReadySchema = Joi.object({
  preparedBy: Joi.string().uuid().required().messages({
    'any.required': 'preparedBy is required (user ID)',
  }),
})

/**
 * Deliver Exit Note Schema
 * Complete delivery workflow
 */
export const deliverExitNoteSchema = Joi.object({
  deliveredBy: Joi.string().uuid().required().messages({
    'any.required': 'deliveredBy is required (user ID)',
  }),
  reference: Joi.string().max(100).optional(),
})

/**
 * Filter Schema for list operations
 */
export const exitNoteFiltersSchema = Joi.object({
  type: Joi.string()
    .valid(...Object.values(ExitNoteType))
    .optional(),
  status: Joi.string()
    .valid('PENDING', 'IN_PROGRESS', 'READY', 'DELIVERED', 'CANCELLED')
    .optional(),
  warehouseId: Joi.string().uuid().optional(),
  recipientId: Joi.string().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
})

/**
 * Exit Note ID Schema
 */
export const exitNoteIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'any.required': 'id is required',
    'string.guid': 'id must be a valid UUID',
  }),
})

/**
 * Return Loan Items Schema
 * For completing LOAN_RETURN exits
 */
export const returnLoanItemsSchema = Joi.object({
  returnedBy: Joi.string().uuid().required().messages({
    'any.required': 'returnedBy is required (user ID)',
  }),
  notes: Joi.string().max(1000).optional(),
})

/**
 * Cancel Exit Note Schema
 */
export const cancelExitNoteSchema = Joi.object({
  reason: Joi.string().max(500).required().messages({
    'any.required': 'Reason for cancellation is required',
  }),
})
