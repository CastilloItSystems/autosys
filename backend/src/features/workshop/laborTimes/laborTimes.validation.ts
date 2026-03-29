// backend/src/features/workshop/laborTimes/laborTimes.validation.ts
import Joi from 'joi'

export const startLaborTimeSchema = Joi.object({
  serviceOrderId: Joi.string().required().messages({ 'any.required': 'La orden de trabajo es requerida' }),
  serviceOrderItemId: Joi.string().optional(),
  operationId: Joi.string().optional(),
  technicianId: Joi.string().required().messages({ 'any.required': 'El técnico es requerido' }),
  notes: Joi.string().trim().max(500).optional().allow(''),
})

export const laborTimeFiltersSchema = Joi.object({
  serviceOrderId: Joi.string().optional(),
  technicianId: Joi.string().optional(),
  status: Joi.string().valid('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED').optional(),
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
})
