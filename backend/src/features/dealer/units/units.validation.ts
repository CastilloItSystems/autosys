import Joi from 'joi'

export const createDealerUnitSchema = Joi.object({
  brandId: Joi.string().required().messages({
    'any.required': 'La marca es requerida',
  }),
  modelId: Joi.string().optional().allow(null, ''),
  code: Joi.string().max(40).optional().allow(null, ''),
  version: Joi.string().max(120).optional().allow(null, ''),
  year: Joi.number().integer().min(1900).max(2100).optional().allow(null),
  vin: Joi.string().max(100).optional().allow(null, ''),
  engineSerial: Joi.string().max(100).optional().allow(null, ''),
  plate: Joi.string().max(20).optional().allow(null, ''),
  condition: Joi.string().valid('NEW', 'USED', 'DEMO', 'CONSIGNMENT').optional(),
  status: Joi.string()
    .valid('AVAILABLE', 'RESERVED', 'IN_DOCUMENTATION', 'INVOICED', 'READY_FOR_DELIVERY', 'DELIVERED', 'BLOCKED')
    .optional(),
  mileage: Joi.number().integer().min(0).optional().allow(null),
  colorExterior: Joi.string().max(80).optional().allow(null, ''),
  colorInterior: Joi.string().max(80).optional().allow(null, ''),
  fuelType: Joi.string().max(50).optional().allow(null, ''),
  transmission: Joi.string().max(50).optional().allow(null, ''),
  listPrice: Joi.number().min(0).optional().allow(null),
  promoPrice: Joi.number().min(0).optional().allow(null),
  location: Joi.string().max(120).optional().allow(null, ''),
  description: Joi.string().optional().allow(null, ''),
  isPublished: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
  specifications: Joi.object().optional().allow(null),
})

export const updateDealerUnitSchema = Joi.object({
  brandId: Joi.string().optional(),
  modelId: Joi.string().optional().allow(null, ''),
  code: Joi.string().max(40).optional().allow(null, ''),
  version: Joi.string().max(120).optional().allow(null, ''),
  year: Joi.number().integer().min(1900).max(2100).optional().allow(null),
  vin: Joi.string().max(100).optional().allow(null, ''),
  engineSerial: Joi.string().max(100).optional().allow(null, ''),
  plate: Joi.string().max(20).optional().allow(null, ''),
  condition: Joi.string().valid('NEW', 'USED', 'DEMO', 'CONSIGNMENT').optional(),
  status: Joi.string()
    .valid('AVAILABLE', 'RESERVED', 'IN_DOCUMENTATION', 'INVOICED', 'READY_FOR_DELIVERY', 'DELIVERED', 'BLOCKED')
    .optional(),
  mileage: Joi.number().integer().min(0).optional().allow(null),
  colorExterior: Joi.string().max(80).optional().allow(null, ''),
  colorInterior: Joi.string().max(80).optional().allow(null, ''),
  fuelType: Joi.string().max(50).optional().allow(null, ''),
  transmission: Joi.string().max(50).optional().allow(null, ''),
  listPrice: Joi.number().min(0).optional().allow(null),
  promoPrice: Joi.number().min(0).optional().allow(null),
  location: Joi.string().max(120).optional().allow(null, ''),
  description: Joi.string().optional().allow(null, ''),
  isPublished: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
  specifications: Joi.object().optional().allow(null),
})

export const dealerUnitFiltersSchema = Joi.object({
  brandId: Joi.string().optional().allow(''),
  modelId: Joi.string().optional().allow(''),
  year: Joi.number().integer().min(1900).max(2100).optional(),
  status: Joi.string()
    .valid('AVAILABLE', 'RESERVED', 'IN_DOCUMENTATION', 'INVOICED', 'READY_FOR_DELIVERY', 'DELIVERED', 'BLOCKED')
    .optional()
    .allow(''),
  condition: Joi.string().valid('NEW', 'USED', 'DEMO', 'CONSIGNMENT').optional().allow(''),
  isActive: Joi.boolean().optional(),
  search: Joi.string().max(200).optional().allow(''),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(20),
  sortBy: Joi.string().valid('name', 'year', 'createdAt', 'updatedAt').default('name'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
})
