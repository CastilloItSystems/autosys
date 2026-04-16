// backend/src/features/inventory/reservations/reservations.validation.ts

import Joi from 'joi'
import { ReservationStatus } from './reservations.interface.js'

export const createReservationSchema = Joi.object({
  itemId: Joi.string().uuid({ version: 'uuidv4' }).required().messages({
    'string.guid': 'itemId debe ser un UUID válido',
    'any.required': 'itemId es requerido',
  }),
  warehouseId: Joi.string().uuid({ version: 'uuidv4' }).required().messages({
    'string.guid': 'warehouseId debe ser un UUID válido',
    'any.required': 'warehouseId es requerido',
  }),
  quantity: Joi.number().integer().positive().required().messages({
    'number.positive': 'quantity debe ser un número positivo',
    'any.required': 'quantity es requerido',
  }),
  workOrderId: Joi.string()
    .uuid({ version: 'uuidv4' })
    .optional()
    .allow(null)
    .messages({
      'string.guid': 'workOrderId debe ser un UUID válido',
    }),
  saleOrderId: Joi.string()
    .uuid({ version: 'uuidv4' })
    .optional()
    .allow(null)
    .messages({
      'string.guid': 'saleOrderId debe ser un UUID válido',
    }),
  reference: Joi.string().max(100).optional().allow(null).messages({
    'string.max': 'reference no puede exceder 100 caracteres',
  }),
  notes: Joi.string().max(1000).optional().allow(null).messages({
    'string.max': 'notes no puede exceder 1000 caracteres',
  }),
  expiresAt: Joi.date().iso().optional().allow(null).messages({
    'date.iso': 'expiresAt debe ser una fecha válida en formato ISO',
  }),
  createdBy: Joi.string().uuid({ version: 'uuidv4' }).optional().allow(null),
})

export const updateReservationSchema = Joi.object({
  quantity: Joi.number().integer().positive().optional().messages({
    'number.positive': 'quantity debe ser un número positivo',
  }),
  workOrderId: Joi.string().uuid({ version: 'uuidv4' }).optional().allow(null),
  saleOrderId: Joi.string().uuid({ version: 'uuidv4' }).optional().allow(null),
  reference: Joi.string().max(100).optional().allow(null),
  notes: Joi.string().max(1000).optional().allow(null),
  expiresAt: Joi.date().iso().optional().allow(null),
}).min(1)

export const consumeReservationSchema = Joi.object({
  quantity: Joi.number().integer().positive().optional().messages({
    'number.positive': 'quantity debe ser un número positivo',
  }),
  deliveredBy: Joi.string().uuid({ version: 'uuidv4' }).required().messages({
    'string.guid': 'deliveredBy debe ser un UUID válido',
    'any.required': 'deliveredBy es requerido',
  }),
})

export const releaseReservationSchema = Joi.object({
  reason: Joi.string().max(500).optional().messages({
    'string.max': 'reason no puede exceder 500 caracteres',
  }),
})

export const reservationIdSchema = Joi.object({
  id: Joi.string().uuid().required()
})

export const itemIdSchema = Joi.object({
  itemId: Joi.string().uuid().required()
})

export const warehouseIdSchema = Joi.object({
  warehouseId: Joi.string().uuid().required()
})

export const getReservationsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid('ACTIVE', 'PENDING_PICKUP', 'CONSUMED', 'RELEASED'),
  itemId: Joi.string().uuid(),
  warehouseId: Joi.string().uuid(),
  workOrderId: Joi.string().uuid().optional(),
  saleOrderId: Joi.string().uuid().optional(),
  createdBy: Joi.string().uuid().optional(),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional(),
  reservedFrom: Joi.date().iso().optional(),
  reservedTo: Joi.date().iso().optional(),
})

export const paginationQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(20)
})
