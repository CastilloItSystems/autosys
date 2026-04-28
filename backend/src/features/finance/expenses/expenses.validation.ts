// backend/src/features/finance/expenses/expenses.validation.ts

import Joi from 'joi'

const CURRENCIES = ['USD', 'VES', 'EUR']
const CATEGORIES = ['UTILITIES', 'RENT', 'PAYROLL', 'SERVICES', 'MAINTENANCE', 'SUPPLIES', 'MARKETING', 'TAXES', 'BANK_FEES', 'TRANSPORT', 'OTHER']
const STATUSES = ['DRAFT', 'PENDING', 'PAID', 'CANCELLED']
const FREQUENCIES = ['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']

export const createExpenseSchema = Joi.object({
  category: Joi.string().valid(...CATEGORIES).required().messages({
    'any.only': 'Categoría no válida',
    'any.required': 'La categoría es obligatoria',
  }),
  description: Joi.string().min(3).max(500).required().messages({
    'any.required': 'La descripción es obligatoria',
  }),
  supplierId: Joi.string().optional().allow(null, ''),
  bankAccountId: Joi.string().optional().allow(null, ''),
  currency: Joi.string().valid(...CURRENCIES).required().messages({
    'any.only': 'Moneda no válida',
    'any.required': 'La moneda es obligatoria',
  }),
  exchangeRate: Joi.number().positive().optional(),
  amount: Joi.number().positive().required().messages({
    'any.required': 'El monto es obligatorio',
  }),
  taxAmount: Joi.number().min(0).default(0),
  expenseDate: Joi.date().required().messages({
    'any.required': 'La fecha del gasto es obligatoria',
  }),
  attachmentUrl: Joi.string().optional().allow('', null),
  isRecurring: Joi.boolean().default(false),
  recurringRuleId: Joi.string().optional().allow(null, ''),
  notes: Joi.string().max(1000).optional().allow('', null),
})

export const updateExpenseSchema = Joi.object({
  category: Joi.string().valid(...CATEGORIES).optional(),
  description: Joi.string().min(3).max(500).optional(),
  supplierId: Joi.string().optional().allow(null, ''),
  currency: Joi.string().valid(...CURRENCIES).optional(),
  exchangeRate: Joi.number().positive().optional(),
  amount: Joi.number().positive().optional(),
  taxAmount: Joi.number().min(0).optional(),
  expenseDate: Joi.date().optional(),
  attachmentUrl: Joi.string().optional().allow('', null),
  notes: Joi.string().max(1000).optional().allow('', null),
}).min(1)

export const createRecurringRuleSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    'any.required': 'El nombre de la regla es obligatorio',
  }),
  category: Joi.string().valid(...CATEGORIES).required().messages({
    'any.only': 'Categoría no válida',
    'any.required': 'La categoría es obligatoria',
  }),
  description: Joi.string().min(3).max(500).required(),
  supplierId: Joi.string().optional().allow(null, ''),
  amount: Joi.number().positive().required().messages({
    'any.required': 'El monto es obligatorio',
  }),
  currency: Joi.string().valid(...CURRENCIES).required(),
  frequency: Joi.string().valid(...FREQUENCIES).required().messages({
    'any.only': 'Frecuencia no válida',
    'any.required': 'La frecuencia es obligatoria',
  }),
  dayOfMonth: Joi.number().integer().min(1).max(31).optional(),
  startDate: Joi.date().required().messages({
    'any.required': 'La fecha de inicio es obligatoria',
  }),
  endDate: Joi.date().optional().allow(null),
})
