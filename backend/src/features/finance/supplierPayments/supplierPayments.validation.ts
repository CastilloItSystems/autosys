// backend/src/features/finance/supplierPayments/supplierPayments.validation.ts

import Joi from 'joi'

const CURRENCIES = ['USD', 'VES', 'EUR']
const METHODS = ['CASH', 'TRANSFER', 'CARD', 'MOBILE_PAYMENT', 'CHECK', 'CREDIT', 'MIXED']

export const createSupplierPaymentSchema = Joi.object({
  supplierId: Joi.string().optional().allow(null, ''),
  supplierBillId: Joi.string().optional().allow(null, ''),
  expenseId: Joi.string().optional().allow(null, ''),
  bankAccountId: Joi.string().required().messages({
    'any.required': 'La cuenta bancaria es obligatoria',
  }),
  method: Joi.string().valid(...METHODS).required().messages({
    'any.only': 'Método de pago no válido',
    'any.required': 'El método de pago es obligatorio',
  }),
  amount: Joi.number().positive().required().messages({
    'number.positive': 'El monto debe ser mayor a cero',
    'any.required': 'El monto es obligatorio',
  }),
  currency: Joi.string().valid(...CURRENCIES).required().messages({
    'any.only': 'Moneda no válida',
    'any.required': 'La moneda es obligatoria',
  }),
  exchangeRate: Joi.number().positive().optional(),
  igtfApplies: Joi.boolean().default(false),
  details: Joi.array().items(Joi.object()).optional(),
  reference: Joi.string().max(100).optional().allow('', null),
  notes: Joi.string().max(500).optional().allow('', null),
})
