// backend/src/features/crm/customers/customers.validation.ts

import Joi from 'joi'

export const createCustomerSchema = Joi.object({
  code: Joi.string().max(50).required().messages({
    'any.required': 'El código es requerido',
    'string.max': 'El código no puede exceder 50 caracteres',
  }),
  name: Joi.string().max(255).required().messages({
    'any.required': 'El nombre es requerido',
  }),
  taxId: Joi.string().max(20).optional().allow(null, ''),
  email: Joi.string().email().optional().allow(null, ''),
  phone: Joi.string().max(20).optional().allow(null, ''),
  mobile: Joi.string().max(20).optional().allow(null, ''),
  website: Joi.string().max(150).optional().allow(null, ''),
  contactPerson: Joi.string().max(100).optional().allow(null, ''),
  address: Joi.string().max(500).optional().allow(null, ''),
  shippingAddress: Joi.string().max(500).optional().allow(null, ''),
  billingAddress: Joi.string().max(500).optional().allow(null, ''),
  type: Joi.string().valid('INDIVIDUAL', 'COMPANY').optional().default('INDIVIDUAL'),
  isSpecialTaxpayer: Joi.boolean().optional(),
  priceList: Joi.number().integer().min(1).optional(),
  creditLimit: Joi.number().min(0).optional(),
  creditDays: Joi.number().integer().min(0).optional(),
  defaultDiscount: Joi.number().min(0).max(100).optional(),
  segment: Joi.string()
    .valid('PROSPECT', 'REGULAR', 'VIP', 'WHOLESALE', 'INACTIVE')
    .optional()
    .default('PROSPECT'),
  preferredChannel: Joi.string()
    .valid('REPUESTOS', 'TALLER', 'VEHICULOS', 'ALL')
    .optional()
    .default('ALL'),
  assignedSellerId: Joi.string().uuid().optional().allow(null, ''),
  customerSince: Joi.string().isoDate().optional().allow(null, ''),
  referredById: Joi.string().uuid().optional().allow(null, ''),
  notes: Joi.string().optional().allow(null, ''),
  metadata: Joi.object().optional().allow(null),
})

export const updateCustomerSchema = Joi.object({
  code: Joi.string().max(50).optional(),
  name: Joi.string().max(255).optional(),
  taxId: Joi.string().max(20).optional().allow(null, ''),
  email: Joi.string().email().optional().allow(null, ''),
  phone: Joi.string().max(20).optional().allow(null, ''),
  mobile: Joi.string().max(20).optional().allow(null, ''),
  website: Joi.string().max(150).optional().allow(null, ''),
  contactPerson: Joi.string().max(100).optional().allow(null, ''),
  address: Joi.string().max(500).optional().allow(null, ''),
  shippingAddress: Joi.string().max(500).optional().allow(null, ''),
  billingAddress: Joi.string().max(500).optional().allow(null, ''),
  type: Joi.string().valid('INDIVIDUAL', 'COMPANY').optional(),
  isSpecialTaxpayer: Joi.boolean().optional(),
  priceList: Joi.number().integer().min(1).optional(),
  creditLimit: Joi.number().min(0).optional(),
  creditDays: Joi.number().integer().min(0).optional(),
  defaultDiscount: Joi.number().min(0).max(100).optional(),
  segment: Joi.string()
    .valid('PROSPECT', 'REGULAR', 'VIP', 'WHOLESALE', 'INACTIVE')
    .optional(),
  preferredChannel: Joi.string()
    .valid('REPUESTOS', 'TALLER', 'VEHICULOS', 'ALL')
    .optional(),
  assignedSellerId: Joi.string().uuid().optional().allow(null, ''),
  customerSince: Joi.string().isoDate().optional().allow(null, ''),
  referredById: Joi.string().uuid().optional().allow(null, ''),
  notes: Joi.string().optional().allow(null, ''),
  metadata: Joi.object().optional().allow(null),
  isActive: Joi.boolean().optional(),
})

export const customerFiltersSchema = Joi.object({
  type: Joi.string().valid('INDIVIDUAL', 'COMPANY').optional(),
  segment: Joi.string()
    .valid('PROSPECT', 'REGULAR', 'VIP', 'WHOLESALE', 'INACTIVE')
    .optional(),
  preferredChannel: Joi.string()
    .valid('REPUESTOS', 'TALLER', 'VEHICULOS', 'ALL')
    .optional(),
  isActive: Joi.boolean().optional(),
  assignedSellerId: Joi.string().uuid().optional(),
  search: Joi.string().max(200).optional().allow(''),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(20),
  sortBy: Joi.string().valid('createdAt', 'name', 'code', 'taxId', 'segment').default('name'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
})
