import Joi from 'joi'

export const listNotificationsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().messages({
    'number.base': 'La página debe ser un número',
    'number.min': 'La página debe ser mayor a 0',
  }),
  limit: Joi.number().integer().min(1).max(200).optional().messages({
    'number.base': 'El límite debe ser un número',
    'number.min': 'El límite debe ser mayor a 0',
    'number.max': 'El límite no puede exceder 200',
  }),
  read: Joi.boolean().optional().messages({
    'boolean.base': 'El campo "read" debe ser verdadero o falso',
  }),
  eventCode: Joi.string().max(100).optional().messages({
    'string.max': 'El código de evento no puede exceder 100 caracteres',
  }),
  module: Joi.string().max(100).optional().messages({
    'string.max': 'El módulo no puede exceder 100 caracteres',
  }),
  severity: Joi.string()
    .valid('INFO', 'WARNING', 'ERROR', 'SUCCESS')
    .optional()
    .messages({
      'any.only': 'La severidad debe ser INFO, WARNING, ERROR o SUCCESS',
    }),
})

export const notificationIdParamSchema = Joi.object({
  id: Joi.string().min(1).required().messages({
    'string.empty': 'El id es requerido',
    'any.required': 'El id es requerido',
  }),
})

const companyPolicyItemSchema = Joi.object({
  eventCode: Joi.string().min(1).max(100).required().messages({
    'string.empty': 'El código de evento es requerido',
    'any.required': 'El código de evento es requerido',
    'string.max': 'El código de evento no puede exceder 100 caracteres',
  }),
  enabled: Joi.boolean().optional().messages({
    'boolean.base': 'El campo "enabled" debe ser verdadero o falso',
  }),
  mandatory: Joi.boolean().optional().messages({
    'boolean.base': 'El campo "mandatory" debe ser verdadero o falso',
  }),
  requiredPermissionsAny: Joi.array().items(Joi.string()).optional().messages({
    'array.base': 'Los permisos requeridos deben ser un arreglo',
  }),
  dedupWindowSec: Joi.number().integer().min(0).optional().messages({
    'number.base': 'La ventana de deduplicación debe ser un número',
    'number.min': 'La ventana de deduplicación no puede ser negativa',
  }),
})

export const upsertCompanyPoliciesSchema = Joi.object({
  policies: Joi.array().items(companyPolicyItemSchema).min(1).required().messages({
    'array.base': 'Las políticas deben ser un arreglo',
    'array.min': 'Se requiere al menos una política',
    'any.required': 'Las políticas son requeridas',
  }),
})

const preferenceItemSchema = Joi.object({
  eventCode: Joi.string().min(1).max(100).required().messages({
    'string.empty': 'El código de evento es requerido',
    'any.required': 'El código de evento es requerido',
    'string.max': 'El código de evento no puede exceder 100 caracteres',
  }),
  enabled: Joi.boolean().required().messages({
    'boolean.base': 'El campo "enabled" debe ser verdadero o falso',
    'any.required': 'El campo "enabled" es requerido',
  }),
})

export const upsertPreferencesSchema = Joi.object({
  preferences: Joi.array().items(preferenceItemSchema).min(1).required().messages({
    'array.base': 'Las preferencias deben ser un arreglo',
    'array.min': 'Se requiere al menos una preferencia',
    'any.required': 'Las preferencias son requeridas',
  }),
})
