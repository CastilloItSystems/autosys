// backend/src/features/finance/cashTransactions/cashTransactions.validation.ts

import Joi from 'joi'

const CURRENCIES = ['USD', 'VES', 'EUR']

export const transferSchema = Joi.object({
  fromAccountId: Joi.string().required().messages({
    'any.required': 'La cuenta origen es obligatoria',
    'string.empty': 'La cuenta origen es obligatoria',
  }),
  toAccountId: Joi.string().required().messages({
    'any.required': 'La cuenta destino es obligatoria',
    'string.empty': 'La cuenta destino es obligatoria',
  }),
  amount: Joi.number().positive().required().messages({
    'any.required': 'El monto es obligatorio',
    'number.positive': 'El monto debe ser mayor a 0',
  }),
  currency: Joi.string()
    .valid(...CURRENCIES)
    .optional()
    .messages({ 'any.only': 'Moneda no válida' }),
  exchangeRate: Joi.number().positive().optional().allow(null).messages({
    'number.positive': 'La tasa de cambio debe ser mayor a 0',
  }),
  description: Joi.string().max(255).optional().allow('', null),
})

export const adjustmentSchema = Joi.object({
  bankAccountId: Joi.string().required().messages({
    'any.required': 'La cuenta bancaria es obligatoria',
    'string.empty': 'La cuenta bancaria es obligatoria',
  }),
  amount: Joi.number().not(0).required().messages({
    'any.required': 'El monto es obligatorio',
    'number.base': 'El monto debe ser un número',
    'any.invalid': 'El monto no puede ser 0',
  }),
  description: Joi.string().min(1).max(255).required().messages({
    'any.required': 'La descripción es obligatoria',
    'string.empty': 'La descripción es obligatoria',
    'string.max': 'La descripción no puede superar 255 caracteres',
  }),
  exchangeRate: Joi.number().positive().optional().allow(null).messages({
    'number.positive': 'La tasa de cambio debe ser mayor a 0',
  }),
})
