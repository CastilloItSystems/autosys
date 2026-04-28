// backend/src/features/finance/bankAccounts/bankAccounts.validation.ts

import Joi from 'joi'

const CURRENCIES = ['USD', 'VES', 'EUR']
const TYPES = ['CHECKING', 'SAVINGS', 'CASH', 'CRYPTO']

export const createBankAccountSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'El nombre es obligatorio',
    'string.min': 'El nombre debe tener al menos 2 caracteres',
    'any.required': 'El nombre es obligatorio',
  }),
  type: Joi.string().valid(...TYPES).required().messages({
    'any.only': 'Tipo de cuenta no válido',
    'any.required': 'El tipo de cuenta es obligatorio',
  }),
  bankName: Joi.string().max(100).optional().allow('', null),
  accountNumber: Joi.string().max(50).optional().allow('', null),
  currency: Joi.string().valid(...CURRENCIES).required().messages({
    'any.only': 'Moneda no válida',
    'any.required': 'La moneda es obligatoria',
  }),
  initialBalance: Joi.number().min(0).default(0),
  notes: Joi.string().max(500).optional().allow('', null),
})

export const updateBankAccountSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  type: Joi.string().valid(...TYPES).optional(),
  bankName: Joi.string().max(100).optional().allow('', null),
  accountNumber: Joi.string().max(50).optional().allow('', null),
  currency: Joi.string().valid(...CURRENCIES).optional(),
  isActive: Joi.boolean().optional(),
  notes: Joi.string().max(500).optional().allow('', null),
}).min(1).messages({
  'object.min': 'Debe enviar al menos un campo para actualizar',
})
