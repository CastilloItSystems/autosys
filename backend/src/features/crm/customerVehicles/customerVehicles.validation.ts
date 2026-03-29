// backend/src/features/crm/customerVehicles/customerVehicles.validation.ts

import Joi from 'joi'

export const createCustomerVehicleSchema = Joi.object({
  plate: Joi.string().max(20).required().messages({
    'any.required': 'La placa es requerida',
    'string.max': 'La placa no puede exceder 20 caracteres',
  }),
  brandId: Joi.string().uuid().optional().allow(null, '').messages({
    'string.uuid': 'El brandId debe ser un UUID válido',
  }),
  modelId: Joi.string().uuid().optional().allow(null, '').messages({
    'string.uuid': 'El modelId debe ser un UUID válido',
  }),
  vin: Joi.string().max(50).optional().allow(null, ''),
  year: Joi.number().integer().min(1900).max(2100).optional().allow(null),
  color: Joi.string().max(50).optional().allow(null, ''),
  fuelType: Joi.string()
    .valid('GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID', 'GAS')
    .optional()
    .allow(null, ''),
  transmission: Joi.string()
    .valid('MANUAL', 'AUTOMATIC', 'CVT')
    .optional()
    .allow(null, ''),
  mileage: Joi.number().integer().min(0).optional().allow(null),
  purchasedHere: Joi.boolean().optional(),
  notes: Joi.string().optional().allow(null, ''),
})

export const updateCustomerVehicleSchema = Joi.object({
  plate: Joi.string().max(20).optional(),
  brandId: Joi.string().uuid().optional().allow(null, ''),
  modelId: Joi.string().uuid().optional().allow(null, ''),
  vin: Joi.string().max(50).optional().allow(null, ''),
  year: Joi.number().integer().min(1900).max(2100).optional().allow(null),
  color: Joi.string().max(50).optional().allow(null, ''),
  fuelType: Joi.string()
    .valid('GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID', 'GAS')
    .optional()
    .allow(null, ''),
  transmission: Joi.string()
    .valid('MANUAL', 'AUTOMATIC', 'CVT')
    .optional()
    .allow(null, ''),
  mileage: Joi.number().integer().min(0).optional().allow(null),
  purchasedHere: Joi.boolean().optional(),
  notes: Joi.string().optional().allow(null, ''),
  isActive: Joi.boolean().optional(),
})

export const customerVehicleFiltersSchema = Joi.object({
  brandId: Joi.string().uuid().optional().allow(''),
  isActive: Joi.boolean().optional(),
  search: Joi.string().max(200).optional().allow(''),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(20),
  sortBy: Joi.string()
    .valid('plate', 'createdAt')
    .default('plate'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
})
