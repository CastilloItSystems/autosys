import Joi from 'joi'

export const createDealerTradeInSchema = Joi.object({
  targetDealerUnitId: Joi.string().optional().allow(null, ''),
  customerName: Joi.string().max(180).required(),
  customerDocument: Joi.string().max(60).optional().allow(null, ''),
  customerPhone: Joi.string().max(40).optional().allow(null, ''),
  customerEmail: Joi.string().email().max(180).optional().allow(null, ''),
  vehicleBrand: Joi.string().max(120).required(),
  vehicleModel: Joi.string().max(120).optional().allow(null, ''),
  vehicleYear: Joi.number().integer().min(1900).max(2100).optional().allow(null),
  vehicleVersion: Joi.string().max(120).optional().allow(null, ''),
  vehicleVin: Joi.string().max(100).optional().allow(null, ''),
  vehiclePlate: Joi.string().max(20).optional().allow(null, ''),
  mileage: Joi.number().integer().min(0).optional().allow(null),
  conditionSummary: Joi.string().optional().allow(null, ''),
  requestedValue: Joi.number().min(0).optional().allow(null),
  appraisedValue: Joi.number().min(0).optional().allow(null),
  approvedValue: Joi.number().min(0).optional().allow(null),
  appraisalDate: Joi.date().iso().optional().allow(null),
  appraiserName: Joi.string().max(120).optional().allow(null, ''),
  notes: Joi.string().optional().allow(null, ''),
  status: Joi.string().valid('PENDING', 'INSPECTED', 'VALUED', 'APPROVED', 'REJECTED', 'APPLIED').optional(),
})

export const updateDealerTradeInSchema = createDealerTradeInSchema.keys({
  customerName: Joi.string().max(180).optional(),
  vehicleBrand: Joi.string().max(120).optional(),
  isActive: Joi.boolean().optional(),
})

export const dealerTradeInFiltersSchema = Joi.object({
  targetDealerUnitId: Joi.string().optional().allow(''),
  status: Joi.string().valid('PENDING', 'INSPECTED', 'VALUED', 'APPROVED', 'REJECTED', 'APPLIED').optional().allow(''),
  isActive: Joi.boolean().optional(),
  search: Joi.string().max(200).optional().allow(''),
  fromDate: Joi.date().iso().optional(),
  toDate: Joi.date().iso().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(20),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'status', 'appraisedValue', 'approvedValue').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
})
