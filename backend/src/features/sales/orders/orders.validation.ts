// backend/src/features/sales/orders/orders.validation.ts

import Joi from 'joi'

const orderItemSchema = Joi.object({
  itemId: Joi.string().uuid().required().messages({
    'any.required': 'itemId es requerido',
    'string.guid': 'itemId debe ser un UUID válido',
  }),
  itemName: Joi.string().max(255).optional().allow(null, ''),
  quantity: Joi.number().integer().min(1).required().messages({
    'any.required': 'quantity es requerido',
    'number.min': 'quantity debe ser al menos 1',
  }),
  unitPrice: Joi.number().min(0).required().messages({
    'any.required': 'unitPrice es requerido',
    'number.min': 'unitPrice debe ser mayor o igual a 0',
  }),
  discountPercent: Joi.number().min(0).max(100).optional().default(0),
  taxType: Joi.string()
    .valid('IVA', 'EXEMPT', 'REDUCED')
    .optional()
    .default('IVA'),
  notes: Joi.string().max(500).optional().allow(null, ''),
})

export const createOrderSchema = Joi.object({
  customerId: Joi.string().uuid().required().messages({
    'any.required': 'customerId es requerido',
    'string.guid': 'customerId debe ser un UUID válido',
  }),
  warehouseId: Joi.string().uuid().required().messages({
    'any.required': 'warehouseId es requerido',
    'string.guid': 'warehouseId debe ser un UUID válido',
  }),
  currency: Joi.string().valid('USD', 'VES', 'EUR').optional().default('USD'),
  exchangeRate: Joi.number().positive().optional().allow(null),
  exchangeRateSource: Joi.string().max(20).optional().allow(null, ''),
  paymentTerms: Joi.string().max(255).optional().allow(null, ''),
  creditDays: Joi.number().integer().min(0).optional().allow(null),
  deliveryTerms: Joi.string().max(255).optional().allow(null, ''),
  discountAmount: Joi.number().min(0).optional().default(0),
  igtfApplies: Joi.boolean().optional().default(false),
  taxRate: Joi.number().min(0).max(100).optional().default(16),
  igtfRate: Joi.number().min(0).max(100).optional().default(3),
  notes: Joi.string().max(1000).optional().allow(null, ''),
  expectedDate: Joi.date().optional().allow(null),
  items: Joi.array().items(orderItemSchema).min(1).required().messages({
    'array.min': 'Debe agregar al menos un artículo',
    'any.required': 'items es requerido',
  }),
})

export const updateOrderSchema = Joi.object({
  customerId: Joi.string().uuid().optional(),
  warehouseId: Joi.string().uuid().optional(),
  currency: Joi.string().valid('USD', 'VES', 'EUR').optional(),
  exchangeRate: Joi.number().positive().optional().allow(null),
  exchangeRateSource: Joi.string().max(20).optional().allow(null, ''),
  paymentTerms: Joi.string().max(255).optional().allow(null, ''),
  creditDays: Joi.number().integer().min(0).optional().allow(null),
  deliveryTerms: Joi.string().max(255).optional().allow(null, ''),
  discountAmount: Joi.number().min(0).optional(),
  igtfApplies: Joi.boolean().optional(),
  taxRate: Joi.number().min(0).max(100).optional(),
  igtfRate: Joi.number().min(0).max(100).optional(),
  notes: Joi.string().max(1000).optional().allow(null, ''),
  expectedDate: Joi.date().optional().allow(null),
  items: Joi.array().items(orderItemSchema).min(1).optional(),
})

export const orderFiltersSchema = Joi.object({
  status: Joi.string()
    .valid('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'CANCELLED')
    .optional(),
  customerId: Joi.string().uuid().optional(),
  warehouseId: Joi.string().uuid().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  search: Joi.string().max(200).optional().allow(''),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string()
    .valid('createdAt', 'orderNumber', 'status', 'orderDate', 'total')
    .default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
})

export const approveOrderSchema = Joi.object({
  approvedBy: Joi.string().optional().allow(null, ''),
})
