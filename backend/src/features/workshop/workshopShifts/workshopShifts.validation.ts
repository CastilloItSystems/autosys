// backend/src/features/workshop/workshopShifts/workshopShifts.validation.ts
import Joi from 'joi'

const timePattern = /^\d{2}:\d{2}$/

export const createShiftSchema = Joi.object({
  code: Joi.string().trim().uppercase().min(2).max(20).required().messages({
    'string.empty': 'El código es requerido',
    'any.required': 'El código es requerido',
  }),
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'El nombre es requerido',
    'any.required': 'El nombre es requerido',
  }),
  startTime: Joi.string().pattern(timePattern).required().messages({
    'string.pattern.base': 'startTime debe estar en formato HH:MM',
    'any.required': 'La hora de inicio es requerida',
  }),
  endTime: Joi.string().pattern(timePattern).required().messages({
    'string.pattern.base': 'endTime debe estar en formato HH:MM',
    'any.required': 'La hora de fin es requerida',
  }),
  workDays: Joi.array().items(Joi.number().integer().min(0).max(6)).min(1).optional()
    .messages({ 'array.min': 'Debe especificar al menos un día de trabajo' }),
})

export const updateShiftSchema = Joi.object({
  code: Joi.string().trim().uppercase().min(2).max(20).optional(),
  name: Joi.string().trim().min(2).max(100).optional(),
  startTime: Joi.string().pattern(timePattern).optional().messages({ 'string.pattern.base': 'startTime debe estar en formato HH:MM' }),
  endTime: Joi.string().pattern(timePattern).optional().messages({ 'string.pattern.base': 'endTime debe estar en formato HH:MM' }),
  workDays: Joi.array().items(Joi.number().integer().min(0).max(6)).min(1).optional(),
  isActive: Joi.boolean().optional(),
}).min(1).messages({ 'object.min': 'Debe proporcionar al menos un campo para actualizar' })

export const shiftFiltersSchema = Joi.object({
  search: Joi.string().trim().optional().allow(''),
  isActive: Joi.boolean().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
})
