import Joi from 'joi'

export const createDealerDeliverySchema = Joi.object({
  dealerUnitId: Joi.string().required(),
  customerName: Joi.string().max(180).required(),
  customerDocument: Joi.string().max(60).optional().allow(null, ''),
  customerPhone: Joi.string().max(40).optional().allow(null, ''),
  customerEmail: Joi.string().email().max(180).optional().allow(null, ''),
  scheduledAt: Joi.date().iso().required(),
  advisorName: Joi.string().max(120).optional().allow(null, ''),
  checklistCompleted: Joi.boolean().optional(),
  documentsSigned: Joi.boolean().optional(),
  accessoriesDelivered: Joi.boolean().optional(),
  observations: Joi.string().optional().allow(null, ''),
  actNumber: Joi.string().max(80).optional().allow(null, ''),
  status: Joi.string().valid('SCHEDULED', 'READY', 'DELIVERED', 'CANCELLED').optional(),
})

export const updateDealerDeliverySchema = createDealerDeliverySchema.keys({
  dealerUnitId: Joi.string().optional(),
  customerName: Joi.string().max(180).optional(),
  scheduledAt: Joi.date().iso().optional(),
  isActive: Joi.boolean().optional(),
})

export const dealerDeliveryFiltersSchema = Joi.object({
  dealerUnitId: Joi.string().optional().allow(''),
  status: Joi.string().valid('SCHEDULED', 'READY', 'DELIVERED', 'CANCELLED').optional().allow(''),
  isActive: Joi.boolean().optional(),
  search: Joi.string().max(200).optional().allow(''),
  fromDate: Joi.date().iso().optional(),
  toDate: Joi.date().iso().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(20),
  sortBy: Joi.string().valid('scheduledAt', 'createdAt', 'updatedAt', 'status').default('scheduledAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
})
