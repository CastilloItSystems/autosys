// backend/src/features/exchangeRates/exchangeRates.validation.ts

import Joi from 'joi'

const VALID_CURRENCIES = ['USD', 'VES', 'EUR']
const VALID_SOURCES = ['BCV', 'PARALLEL', 'MANUAL']

export const createExchangeRateSchema = Joi.object({
  fromCurrency: Joi.string()
    .valid(...VALID_CURRENCIES)
    .required()
    .messages({
      'any.required': 'La moneda origen es requerida',
      'any.only': `La moneda origen debe ser una de: ${VALID_CURRENCIES.join(', ')}`,
    }),
  toCurrency: Joi.string()
    .valid(...VALID_CURRENCIES)
    .required()
    .invalid(Joi.ref('fromCurrency'))
    .messages({
      'any.required': 'La moneda destino es requerida',
      'any.only': `La moneda destino debe ser una de: ${VALID_CURRENCIES.join(', ')}`,
      'any.invalid': 'La moneda destino debe ser diferente a la moneda origen',
    }),
  rate: Joi.number()
    .positive()
    .required()
    .messages({
      'any.required': 'La tasa de cambio es requerida',
      'number.positive': 'La tasa de cambio debe ser un número positivo',
    }),
  rateDate: Joi.string()
    .isoDate()
    .required()
    .messages({
      'any.required': 'La fecha de la tasa es requerida',
      'string.isoDate': 'La fecha debe estar en formato ISO (YYYY-MM-DD)',
    }),
  source: Joi.string()
    .valid(...VALID_SOURCES)
    .optional()
    .default('MANUAL')
    .messages({
      'any.only': `La fuente debe ser una de: ${VALID_SOURCES.join(', ')}`,
    }),
  notes: Joi.string().max(500).optional().allow(null, ''),
})

export const updateExchangeRateSchema = Joi.object({
  rate: Joi.number().positive().optional().messages({
    'number.positive': 'La tasa de cambio debe ser un número positivo',
  }),
  notes: Joi.string().max(500).optional().allow(null, ''),
  isActive: Joi.boolean().optional(),
}).min(1).messages({
  'object.min': 'Debe proporcionar al menos un campo para actualizar',
})

export const listExchangeRatesSchema = Joi.object({
  fromCurrency: Joi.string().valid(...VALID_CURRENCIES).optional(),
  toCurrency: Joi.string().valid(...VALID_CURRENCIES).optional(),
  source: Joi.string().valid(...VALID_SOURCES).optional(),
  dateFrom: Joi.string().isoDate().optional(),
  dateTo: Joi.string().isoDate().optional(),
  isActive: Joi.boolean().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(30),
})

export const getLatestRateSchema = Joi.object({
  fromCurrency: Joi.string().valid(...VALID_CURRENCIES).required().messages({
    'any.required': 'fromCurrency es requerido',
  }),
  toCurrency: Joi.string().valid(...VALID_CURRENCIES).required().messages({
    'any.required': 'toCurrency es requerido',
  }),
  source: Joi.string().valid(...VALID_SOURCES).optional(),
})

export const getRateForDateSchema = Joi.object({
  fromCurrency: Joi.string().valid(...VALID_CURRENCIES).required().messages({
    'any.required': 'fromCurrency es requerido',
  }),
  toCurrency: Joi.string().valid(...VALID_CURRENCIES).required().messages({
    'any.required': 'toCurrency es requerido',
  }),
  source: Joi.string().valid(...VALID_SOURCES).optional(),
})

export const exchangeRateIdSchema = Joi.object({
  id: Joi.string().required().messages({
    'any.required': 'El ID de la tasa es requerido',
  }),
})

export const rateDateParamSchema = Joi.object({
  date: Joi.string().isoDate().required().messages({
    'any.required': 'La fecha es requerida',
    'string.isoDate': 'La fecha debe estar en formato YYYY-MM-DD',
  }),
})
