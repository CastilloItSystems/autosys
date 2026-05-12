// backend/src/features/sales/creditNotes/creditNotes.validation.ts

import Joi from 'joi'

const creditNoteItemSchema = Joi.object({
  itemId: Joi.string().optional(),
  itemName: Joi.string().max(500).optional().allow('', null),
  quantity: Joi.number().integer().min(1).required().messages({
    'number.min': 'La cantidad debe ser al menos 1',
    'any.required': 'La cantidad es requerida',
  }),
  unitPrice: Joi.number().positive().required().messages({
    'number.positive': 'El precio unitario debe ser mayor a cero',
    'any.required': 'El precio unitario es requerido',
  }),
  discountPercent: Joi.number().min(0).max(100).optional().default(0),
  discountAmount: Joi.number().min(0).optional().default(0),
  taxType: Joi.string().valid('IVA', 'EXEMPT', 'REDUCED').optional(),
  taxRate: Joi.number().min(0).optional().default(0),
  taxAmount: Joi.number().min(0).required().messages({
    'any.required': 'El monto de impuesto del ítem es requerido',
  }),
  subtotal: Joi.number().min(0).required().messages({
    'any.required': 'El subtotal del ítem es requerido',
  }),
  totalLine: Joi.number().min(0).required().messages({
    'any.required': 'El total de la línea es requerido',
  }),
})

export const createCreditNoteSchema = Joi.object({
  invoiceId: Joi.string().required().messages({
    'any.required': 'El ID de la factura es requerido',
    'string.empty': 'El ID de la factura no puede estar vacío',
  }),
  reason: Joi.string().min(5).max(1000).required().messages({
    'string.min': 'El motivo debe tener al menos 5 caracteres',
    'any.required': 'El motivo de la nota de crédito es requerido',
  }),
  currency: Joi.string().valid('USD', 'VES', 'EUR').optional(),
  exchangeRate: Joi.number().positive().optional(),
  discountAmount: Joi.number().min(0).optional().default(0),
  subtotalBruto: Joi.number().min(0).required().messages({
    'any.required': 'El subtotal bruto es requerido',
  }),
  baseImponible: Joi.number().min(0).optional().default(0),
  baseExenta: Joi.number().min(0).optional().default(0),
  taxAmount: Joi.number().min(0).required().messages({
    'any.required': 'El monto de impuesto es requerido',
  }),
  taxRate: Joi.number().min(0).optional().default(0),
  igtfApplies: Joi.boolean().optional().default(false),
  igtfRate: Joi.number().min(0).optional().default(0),
  igtfAmount: Joi.number().min(0).optional().default(0),
  total: Joi.number().positive().required().messages({
    'number.positive': 'El total debe ser mayor a cero',
    'any.required': 'El total es requerido',
  }),
  notes: Joi.string().max(2000).optional().allow('', null),
  items: Joi.array().items(creditNoteItemSchema).min(1).required().messages({
    'array.min': 'La nota de crédito debe tener al menos un ítem',
    'any.required': 'Los ítems son requeridos',
  }),
})

export const cancelCreditNoteSchema = Joi.object({
  cancellationReason: Joi.string().max(500).required().messages({
    'any.required': 'El motivo de anulación es requerido',
    'string.empty': 'El motivo de anulación no puede estar vacío',
  }),
})

export const creditNoteFiltersSchema = Joi.object({
  status: Joi.string().valid('DRAFT', 'ACTIVE', 'CANCELLED').optional(),
  invoiceId: Joi.string().optional(),
  customerId: Joi.string().optional(),
  from: Joi.string().isoDate().optional(),
  to: Joi.string().isoDate().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
})
