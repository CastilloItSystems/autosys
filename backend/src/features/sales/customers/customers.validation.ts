// backend/src/features/sales/customers/customers.validation.ts

import Joi from 'joi'

export const createCustomerSchema = Joi.object({
  code: Joi.string().max(50).required().messages({
    'any.required': 'El código es requerido',
    'string.max': 'El código no puede exceder 50 caracteres',
  }),
  taxId: Joi.string().max(20).optional().allow(null, '').messages({
    'string.max': 'El RIF/Cédula no puede exceder 20 caracteres',
  }),
  name: Joi.string().max(255).required().messages({
    'any.required': 'El nombre es requerido',
    'string.max': 'El nombre no puede exceder 255 caracteres',
  }),
  email: Joi.string().email().optional().allow(null, ''),
  phone: Joi.string().max(20).optional().allow(null, ''),
  mobile: Joi.string().max(20).optional().allow(null, ''),
  website: Joi.string().max(150).optional().allow(null, ''),
  contactPerson: Joi.string().max(100).optional().allow(null, ''),
  address: Joi.string().max(500).optional().allow(null, ''),
  shippingAddress: Joi.string().max(500).optional().allow(null, ''),
  billingAddress: Joi.string().max(500).optional().allow(null, ''),
  type: Joi.string()
    .valid('INDIVIDUAL', 'COMPANY')
    .optional()
    .default('INDIVIDUAL'),
  isSpecialTaxpayer: Joi.boolean().optional(),
  priceList: Joi.number().integer().min(1).optional(),
  creditLimit: Joi.number().min(0).optional(),
  creditDays: Joi.number().integer().min(0).optional(),
  defaultDiscount: Joi.number().min(0).max(100).optional(),
  sellerId: Joi.string().uuid().optional().allow(null, ''),
  notes: Joi.string().optional().allow(null, ''),
  metadata: Joi.object().optional().allow(null),
})

export const updateCustomerSchema = Joi.object({
  code: Joi.string().max(50).optional(),
  taxId: Joi.string().max(20).optional().allow(null, ''),
  name: Joi.string().max(255).optional(),
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
  sellerId: Joi.string().uuid().optional().allow(null, ''),
  notes: Joi.string().optional().allow(null, ''),
  metadata: Joi.object().optional().allow(null),
  isActive: Joi.boolean().optional(),
})

export const customerFiltersSchema = Joi.object({
  type: Joi.string().valid('INDIVIDUAL', 'COMPANY').optional(),
  isActive: Joi.boolean().optional(),
  search: Joi.string().max(200).optional().allow(''),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(20),
  sortBy: Joi.string()
    .valid('createdAt', 'name', 'code', 'taxId')
    .default('name'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
})
