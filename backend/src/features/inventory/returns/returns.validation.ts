// backend/src/features/inventory/returns/returns.validation.ts

import Joi from 'joi'

export const createReturnSchema = Joi.object({
  type: Joi.string()
    .valid('SUPPLIER_RETURN', 'WORKSHOP_RETURN', 'CUSTOMER_RETURN')
    .required(),
  warehouseId: Joi.string().uuid().required(),
  reason: Joi.string().required(),
  items: Joi.array()
    .items(
      Joi.object({
        itemId: Joi.string().uuid().required(),
        quantity: Joi.number().integer().positive().required(),
        unitPrice: Joi.number().allow(null).optional(),
        notes: Joi.string().optional(),
      })
    )
    .min(1)
    .required(),
  notes: Joi.string().allow(null).optional(),
})

export const updateReturnSchema = Joi.object({
  reason: Joi.string().optional(),
  notes: Joi.string().allow(null).optional(),
}).min(1)

export const returnFiltersSchema = Joi.object({
  type: Joi.string()
    .valid('SUPPLIER_RETURN', 'WORKSHOP_RETURN', 'CUSTOMER_RETURN')
    .optional(),
  status: Joi.string()
    .valid(
      'DRAFT',
      'PENDING_APPROVAL',
      'APPROVED',
      'PROCESSED',
      'REJECTED',
      'CANCELLED'
    )
    .optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).optional(),
})
