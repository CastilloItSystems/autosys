// backend/src/features/inventory/entryNotes/entryNotes.validation.ts

import Joi from 'joi'
import { ENTRY_TYPES, ENTRY_NOTE_STATUSES } from './entryNotes.interface.js'

export const createEntryNoteSchema = Joi.object({
  type: Joi.string()
    .valid(...ENTRY_TYPES)
    .default('PURCHASE')
    .messages({
      'any.only': `type debe ser uno de: ${ENTRY_TYPES.join(', ')}`,
    }),
  purchaseOrderId: Joi.string()
    .uuid({ version: 'uuidv4', separator: '-' })
    .optional()
    .allow(null)
    .messages({
      'string.guid': 'purchaseOrderId debe ser un UUID válido',
    }),
  warehouseId: Joi.string()
    .uuid({ version: 'uuidv4', separator: '-' })
    .required()
    .messages({
      'string.guid': 'warehouseId debe ser un UUID válido',
      'any.required': 'warehouseId es requerido',
    }),
  catalogSupplierId: Joi.string()
    .uuid({ version: 'uuidv4', separator: '-' })
    .optional()
    .allow(null)
    .messages({
      'string.guid': 'catalogSupplierId debe ser un UUID válido',
    }),
  supplierName: Joi.string().max(200).optional().allow(null),
  supplierId: Joi.string().max(100).optional().allow(null),
  supplierPhone: Joi.string().max(50).optional().allow(null),
  reason: Joi.string().max(2000).optional().allow(null),
  reference: Joi.string().max(200).optional().allow(null),
  notes: Joi.string().max(2000).optional().allow(null),
  receivedBy: Joi.string().optional().allow(null),
  authorizedBy: Joi.string().optional().allow(null),
})

export const updateEntryNoteSchema = Joi.object({
  status: Joi.string()
    .valid(...ENTRY_NOTE_STATUSES)
    .optional()
    .messages({
      'any.only': `status debe ser uno de: ${ENTRY_NOTE_STATUSES.join(', ')}`,
    }),
  notes: Joi.string().max(2000).allow(null).optional(),
  receivedBy: Joi.string().allow(null).optional(),
  verifiedBy: Joi.string().allow(null).optional(),
  authorizedBy: Joi.string().allow(null).optional(),
  catalogSupplierId: Joi.string()
    .uuid({ version: 'uuidv4', separator: '-' })
    .optional()
    .allow(null)
    .messages({
      'string.guid': 'catalogSupplierId debe ser un UUID válido',
    }),
  supplierName: Joi.string().max(200).allow(null).optional(),
  supplierId: Joi.string().max(100).allow(null).optional(),
  supplierPhone: Joi.string().max(50).allow(null).optional(),
  reason: Joi.string().max(2000).allow(null).optional(),
  reference: Joi.string().max(200).allow(null).optional(),
}).min(1)

export const addEntryNoteItemSchema = Joi.object({
  itemId: Joi.string()
    .uuid({ version: 'uuidv4', separator: '-' })
    .required()
    .messages({
      'string.guid': 'itemId debe ser un UUID válido',
      'any.required': 'itemId es requerido',
    }),
  quantityReceived: Joi.number().integer().positive().required().messages({
    'number.positive': 'quantityReceived debe ser mayor a 0',
    'number.integer': 'quantityReceived debe ser un número entero',
    'any.required': 'quantityReceived es requerido',
  }),
  unitCost: Joi.number().positive().required().messages({
    'number.positive': 'unitCost debe ser mayor a 0',
    'any.required': 'unitCost es requerido',
  }),
  storedToLocation: Joi.string().max(100).optional().allow(null),
  batchId: Joi.string()
    .uuid({ version: 'uuidv4', separator: '-' })
    .optional()
    .allow(null),
  serialNumberId: Joi.string()
    .uuid({ version: 'uuidv4', separator: '-' })
    .optional()
    .allow(null),
  batchNumber: Joi.string().optional().allow(null),
  expiryDate: Joi.date().iso().optional().allow(null),
  notes: Joi.string().max(2000).optional().allow(null),
})

export const entryNoteIdSchema = Joi.object({
  id: Joi.string()
    .uuid({ version: 'uuidv4', separator: '-' })
    .required()
    .messages({
      'string.guid': 'id debe ser un UUID válido',
      'any.required': 'id es requerido',
    }),
})

export const getEntryNotesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  type: Joi.string()
    .valid(...ENTRY_TYPES)
    .optional(),
  status: Joi.string()
    .valid(...ENTRY_NOTE_STATUSES)
    .optional(),
  purchaseOrderId: Joi.string()
    .uuid({ version: 'uuidv4', separator: '-' })
    .optional(),
  warehouseId: Joi.string()
    .uuid({ version: 'uuidv4', separator: '-' })
    .optional(),
  catalogSupplierId: Joi.string()
    .uuid({ version: 'uuidv4', separator: '-' })
    .optional(),
  receivedBy: Joi.string().optional(),
  receivedFrom: Joi.date().iso().optional(),
  receivedTo: Joi.date().iso().optional(),
  sortBy: Joi.string()
    .valid('createdAt', 'entryNoteNumber', 'type', 'status')
    .default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
})
