// backend/src/features/workshop/deliveries/deliveries.validation.ts
import Joi from 'joi'

export const createDeliverySchema = Joi.object({
  serviceOrderId: Joi.string()
    .required()
    .messages({ 'any.required': 'La orden de servicio es requerida' }),
  deliveredBy: Joi.string()
    .required()
    .messages({ 'any.required': 'El nombre de quien entrega es requerido' }),
  receivedByName: Joi.string()
    .required()
    .trim()
    .max(150)
    .messages({ 'any.required': 'El nombre de quien recibe es requerido' }),
  clientConformity: Joi.boolean().optional().default(true),
  clientSignature: Joi.string().trim().optional().allow(''),
  observations: Joi.string().trim().max(1000).optional().allow(''),
  nextVisitDate: Joi.date().iso().optional(),
})

// Filtros/paginación de GET / — saneamos sortBy/sortOrder/page/limit
export const deliveryFiltersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string()
    .valid('createdAt', 'updatedAt', 'nextVisitDate')
    .default('createdAt')
    .messages({ 'any.only': 'Campo de ordenamiento inválido' }),
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({ 'any.only': 'El orden debe ser "asc" o "desc"' }),
})

// FASE 1.1: Update schema - all fields optional except id
export const updateDeliverySchema = Joi.object({
  receivedByName: Joi.string()
    .trim()
    .max(150)
    .optional()
    .messages({ 'string.max': 'Máximo 150 caracteres' }),
  clientConformity: Joi.boolean().optional(),
  clientSignature: Joi.string().trim().optional().allow(''),
  observations: Joi.string().trim().max(1000).optional().allow(''),
  nextVisitDate: Joi.date().iso().optional(),
  // Note: serviceOrderId, deliveredBy, deliveredAt are immutable
})
