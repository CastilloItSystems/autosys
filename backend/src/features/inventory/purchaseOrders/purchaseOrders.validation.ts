// backend/src/features/inventory/purchaseOrders/purchaseOrders.validation.ts

import Joi from 'joi'
import { PurchaseOrderStatus } from './purchaseOrders.interface.js'

export const createPurchaseOrderSchema = Joi.object({
  supplierId: Joi.string().uuid({ version: 'uuidv4' }).required().messages({
    'string.guid': 'supplierId debe ser un UUID válido',
    'any.required': 'supplierId es requerido',
  }),
  warehouseId: Joi.string().uuid({ version: 'uuidv4' }).required().messages({
    'string.guid': 'warehouseId debe ser un UUID válido',
    'any.required': 'warehouseId es requerido',
  }),
  notes: Joi.string().max(2000).optional().allow(null).messages({
    'string.max': 'notes no puede exceder 2000 caracteres',
  }),
  expectedDate: Joi.date().iso().optional().allow(null).messages({
    'date.iso': 'expectedDate debe ser una fecha válida en formato ISO',
  }),
  createdBy: Joi.string().uuid({ version: 'uuidv4' }).optional().allow(null),
  items: Joi.array()
    .items(
      Joi.object({
        itemId: Joi.string().uuid({ version: 'uuidv4' }).required(),
        quantityOrdered: Joi.number().integer().positive().required(),
        unitCost: Joi.number().positive().required(),
      })
    )
    .min(1)
    .optional(),
})

export const updatePurchaseOrderSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(PurchaseOrderStatus))
    .optional()
    .messages({
      'any.only': `status debe ser uno de: ${Object.values(PurchaseOrderStatus).join(', ')}`,
    }),
  notes: Joi.string().max(2000).optional().allow(null),
  expectedDate: Joi.date().iso().optional().allow(null),
}).min(1)

export const approvePurchaseOrderSchema = Joi.object({
  approvedBy: Joi.string().optional().allow(null, '').messages({
    'string.empty': 'approvedBy no puede estar vacío',
  }),
})

export const addPurchaseOrderItemSchema = Joi.object({
  itemId: Joi.string().uuid({ version: 'uuidv4' }).required().messages({
    'string.guid': 'itemId debe ser un UUID válido',
    'any.required': 'itemId es requerido',
  }),
  quantityOrdered: Joi.number().integer().positive().required().messages({
    'number.positive': 'quantityOrdered debe ser un número positivo',
    'any.required': 'quantityOrdered es requerido',
  }),
  unitCost: Joi.number().positive().required().messages({
    'number.positive': 'unitCost debe ser un número positivo',
    'any.required': 'unitCost es requerido',
  }),
})

export const receiveOrderSchema = Joi.object({
  warehouseId: Joi.string().uuid({ version: 'uuidv4' }).optional().messages({
    'string.guid': 'warehouseId debe ser un UUID válido',
  }),
  notes: Joi.string().max(2000).optional().allow(null),
  receivedBy: Joi.string().optional().allow(null),
  items: Joi.array()
    .items(
      Joi.object({
        itemId: Joi.string().uuid({ version: 'uuidv4' }).required().messages({
          'string.guid': 'itemId debe ser un UUID válido',
          'any.required': 'itemId es requerido',
        }),
        quantityReceived: Joi.number()
          .integer()
          .positive()
          .required()
          .messages({
            'number.positive': 'quantityReceived debe ser mayor a 0',
            'any.required': 'quantityReceived es requerido',
          }),
        unitCost: Joi.number().positive().required().messages({
          'number.positive': 'unitCost debe ser mayor a 0',
          'any.required': 'unitCost es requerido',
        }),
        batchNumber: Joi.string().optional().allow(null),
        expiryDate: Joi.date().iso().optional().allow(null),
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'Debe incluir al menos un item para recepcionar',
      'any.required': 'items es requerido',
    }),
})
