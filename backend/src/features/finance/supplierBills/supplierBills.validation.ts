// backend/src/features/finance/supplierBills/supplierBills.validation.ts

import Joi from 'joi'

const CURRENCIES = ['USD', 'VES', 'EUR']
const STATUSES = ['PENDING_INVOICE', 'PENDING', 'PARTIAL', 'PAID', 'CANCELLED']
const TAX_TYPES = ['IVA', 'EXEMPT', 'REDUCED']

const supplierBillItemSchema = Joi.object({
  itemId: Joi.string().optional().allow(null, ''),
  itemName: Joi.string().max(255).optional().allow(null, ''),
  quantity: Joi.number().integer().positive().required(),
  unitCost: Joi.number().min(0).required(),
  discountPercent: Joi.number().min(0).max(100).default(0),
  taxType: Joi.string().valid(...TAX_TYPES).default('IVA'),
  taxRate: Joi.number().min(0).max(100).default(16),
  notes: Joi.string().max(1000).optional().allow('', null),
})

export const createSupplierBillSchema = Joi.object({
  billNumber: Joi.string().max(50).required().messages({
    'string.empty': 'El número de factura es obligatorio',
    'any.required': 'El número de factura es obligatorio',
  }),
  supplierId: Joi.string().required().messages({
    'any.required': 'El proveedor es obligatorio',
  }),
  purchaseOrderId: Joi.string().optional().allow(null, ''),
  currency: Joi.string().valid(...CURRENCIES).required().messages({
    'any.only': 'Moneda no válida',
    'any.required': 'La moneda es obligatoria',
  }),
  exchangeRate: Joi.number().positive().optional(),
  issueDate: Joi.date().required().messages({
    'any.required': 'La fecha de emisión es obligatoria',
  }),
  dueDate: Joi.date().optional().allow(null),
  attachmentUrl: Joi.string().optional().allow('', null),
  notes: Joi.string().max(1000).optional().allow('', null),
  items: Joi.array().items(supplierBillItemSchema).min(1).required().messages({
    'array.min': 'Debe agregar al menos un item a la factura',
    'any.required': 'Debe agregar al menos un item a la factura',
  }),
})

export const updateSupplierBillSchema = Joi.object({
  billNumber: Joi.string().max(50).optional(),
  currency: Joi.string().valid(...CURRENCIES).optional(),
  exchangeRate: Joi.number().positive().optional(),
  subtotal: Joi.number().min(0).optional(),
  taxAmount: Joi.number().min(0).optional(),
  total: Joi.number().min(0).optional(),
  issueDate: Joi.date().optional(),
  dueDate: Joi.date().optional().allow(null),
  attachmentUrl: Joi.string().optional().allow('', null),
  notes: Joi.string().max(1000).optional().allow('', null),
  status: Joi.string().valid(...STATUSES).optional(),
  items: Joi.array().items(supplierBillItemSchema).min(1).optional(),
}).min(1)

export const registerSupplierInvoiceSchema = Joi.object({
  billNumber: Joi.string().max(50).required().messages({
    'string.empty': 'El número de factura es obligatorio',
    'any.required': 'El número de factura es obligatorio',
  }),
  issueDate: Joi.date().required().messages({
    'any.required': 'La fecha de emisión es obligatoria',
  }),
  dueDate: Joi.date().optional().allow(null),
  attachmentUrl: Joi.string().optional().allow('', null),
  notes: Joi.string().max(1000).optional().allow('', null),
  subtotal: Joi.number().min(0).optional(),
  taxAmount: Joi.number().min(0).optional(),
  total: Joi.number().min(0).optional(),
})
