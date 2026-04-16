import Joi from 'joi'

export const createDealerTestDriveSchema = Joi.object({
  dealerUnitId: Joi.string().required().messages({
    'any.required': 'La unidad es requerida',
  }),
  customerName: Joi.string().max(180).required().messages({
    'any.required': 'El nombre del cliente es requerido',
  }),
  customerDocument: Joi.string().max(60).optional().allow(null, ''),
  customerPhone: Joi.string().max(40).optional().allow(null, ''),
  customerEmail: Joi.string().email().max(180).optional().allow(null, ''),
  driverLicense: Joi.string().max(80).optional().allow(null, ''),
  scheduledAt: Joi.date().iso().required().messages({
    'any.required': 'La fecha/hora de prueba es requerida',
  }),
  advisorName: Joi.string().max(120).optional().allow(null, ''),
  routeDescription: Joi.string().optional().allow(null, ''),
  observations: Joi.string().optional().allow(null, ''),
  customerFeedback: Joi.string().optional().allow(null, ''),
  status: Joi.string().valid('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED').optional(),
})

export const updateDealerTestDriveSchema = Joi.object({
  customerName: Joi.string().max(180).optional(),
  customerDocument: Joi.string().max(60).optional().allow(null, ''),
  customerPhone: Joi.string().max(40).optional().allow(null, ''),
  customerEmail: Joi.string().email().max(180).optional().allow(null, ''),
  driverLicense: Joi.string().max(80).optional().allow(null, ''),
  scheduledAt: Joi.date().iso().optional(),
  advisorName: Joi.string().max(120).optional().allow(null, ''),
  routeDescription: Joi.string().optional().allow(null, ''),
  observations: Joi.string().optional().allow(null, ''),
  customerFeedback: Joi.string().optional().allow(null, ''),
  status: Joi.string().valid('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED').optional(),
  isActive: Joi.boolean().optional(),
})

export const dealerTestDriveFiltersSchema = Joi.object({
  dealerUnitId: Joi.string().optional().allow(''),
  status: Joi.string().valid('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED').optional().allow(''),
  isActive: Joi.boolean().optional(),
  search: Joi.string().max(200).optional().allow(''),
  fromDate: Joi.date().iso().optional(),
  toDate: Joi.date().iso().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(20),
  sortBy: Joi.string().valid('scheduledAt', 'createdAt', 'updatedAt', 'status').default('scheduledAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
})
