// backend/src/features/inventory/cycleCounts/cycleCounts.validation.ts

import Joi from 'joi'

export const createCycleCountSchema = Joi.object({
  warehouseId: Joi.string().uuid().required(),
  notes: Joi.string().max(500).optional(),
  items: Joi.array()
    .items(
      Joi.object({
        itemId: Joi.string().uuid().required(),
        expectedQuantity: Joi.number().integer().min(0).required(),
        location: Joi.string().max(255).optional(),
        notes: Joi.string().max(255).optional(),
      })
    )
    .min(1)
    .required(),
})

export const updateCycleCountSchema = Joi.object({
  notes: Joi.string().max(500).optional(),
  remarks: Joi.string().max(500).optional(),
}).min(1)

export const startCycleCountSchema = Joi.object({
  startedBy: Joi.string().uuid().required(),
})

export const completeCycleCountSchema = Joi.object({
  completedBy: Joi.string().uuid().required(),
})

export const approveCycleCountSchema = Joi.object({
  approvedBy: Joi.string().uuid().required(),
})

export const applyCycleCountSchema = Joi.object({
  appliedBy: Joi.string().uuid().required(),
})

export const addCycleCountItemSchema = Joi.object({
  itemId: Joi.string().uuid().required(),
  expectedQuantity: Joi.number().integer().min(0).required(),
  location: Joi.string().max(255).optional(),
  notes: Joi.string().max(255).optional(),
})
