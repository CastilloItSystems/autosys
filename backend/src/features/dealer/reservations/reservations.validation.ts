import Joi from 'joi'

export const createDealerReservationSchema = Joi.object({
  dealerUnitId: Joi.string().required().messages({
    'any.required': 'La unidad es requerida',
  }),
  customerName: Joi.string().max(180).required().messages({
    'any.required': 'El nombre del cliente es requerido',
  }),
  customerDocument: Joi.string().max(60).optional().allow(null, ''),
  customerPhone: Joi.string().max(40).optional().allow(null, ''),
  customerEmail: Joi.string().email().max(180).optional().allow(null, ''),
  offeredPrice: Joi.number().min(0).optional().allow(null),
  depositAmount: Joi.number().min(0).optional().allow(null),
  currency: Joi.string().max(8).optional().allow(null, ''),
  expiresAt: Joi.date().iso().optional().allow(null),
  notes: Joi.string().optional().allow(null, ''),
  sourceChannel: Joi.string().max(80).optional().allow(null, ''),
  status: Joi.string().valid('PENDING', 'CONFIRMED', 'EXPIRED', 'CANCELLED', 'CONVERTED').optional(),
})

export const updateDealerReservationSchema = Joi.object({
  customerName: Joi.string().max(180).optional(),
  customerDocument: Joi.string().max(60).optional().allow(null, ''),
  customerPhone: Joi.string().max(40).optional().allow(null, ''),
  customerEmail: Joi.string().email().max(180).optional().allow(null, ''),
  offeredPrice: Joi.number().min(0).optional().allow(null),
  depositAmount: Joi.number().min(0).optional().allow(null),
  currency: Joi.string().max(8).optional().allow(null, ''),
  expiresAt: Joi.date().iso().optional().allow(null),
  notes: Joi.string().optional().allow(null, ''),
  sourceChannel: Joi.string().max(80).optional().allow(null, ''),
  status: Joi.string().valid('PENDING', 'CONFIRMED', 'EXPIRED', 'CANCELLED', 'CONVERTED').optional(),
  isActive: Joi.boolean().optional(),
})

export const dealerReservationFiltersSchema = Joi.object({
  dealerUnitId: Joi.string().optional().allow(''),
  status: Joi.string().valid('PENDING', 'CONFIRMED', 'EXPIRED', 'CANCELLED', 'CONVERTED').optional().allow(''),
  isActive: Joi.boolean().optional(),
  search: Joi.string().max(200).optional().allow(''),
  fromDate: Joi.date().iso().optional(),
  toDate: Joi.date().iso().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(20),
  sortBy: Joi.string().valid('reservedAt', 'createdAt', 'updatedAt', 'status').default('reservedAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
})
