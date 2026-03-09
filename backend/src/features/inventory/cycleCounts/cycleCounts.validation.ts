// backend/src/features/inventory/cycleCounts/cycleCounts.validation.ts

import Joi from 'joi'

export const createCycleCountSchema = Joi.object({
  warehouseId: Joi.string().uuid().required(),
  notes: Joi.string().max(500).optional().allow(null, ''),
  items: Joi.array()
    .items(
      Joi.object({
        itemId: Joi.string().uuid().required(),
        expectedQuantity: Joi.number().integer().min(0).required(),
        location: Joi.string().max(255).optional().allow(null, ''),
        notes: Joi.string().max(255).optional().allow(null, ''),
      })
    )
    .min(1)
    .required(),
})

export const updateCycleCountSchema = Joi.object({
  notes: Joi.string().max(500).optional(),
  remarks: Joi.string().max(500).optional(),
  items: Joi.array()
    .items(
      Joi.object({
        itemId: Joi.string().uuid().required(),
        expectedQuantity: Joi.number().integer().min(0).required(),
        location: Joi.string().max(255).optional().allow(null, ''),
        notes: Joi.string().max(255).optional().allow(null, ''),
      })
    )
    .optional(),
}).min(1)

export const startCycleCountSchema = Joi.object({
  startedBy: Joi.string().required(),
})

export const completeCycleCountSchema = Joi.object({
  completedBy: Joi.string().required(),
})

export const approveCycleCountSchema = Joi.object({
  approvedBy: Joi.string().required(),
})

export const applyCycleCountSchema = Joi.object({
  appliedBy: Joi.string().required(),
})

export const addCycleCountItemSchema = Joi.object({
  itemId: Joi.string().uuid().required(),
  expectedQuantity: Joi.number().integer().min(0).required(),
  location: Joi.string().max(255).optional(),
  notes: Joi.string().max(255).optional(),
})
