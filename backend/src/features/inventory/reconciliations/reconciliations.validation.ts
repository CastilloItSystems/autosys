// backend/src/features/inventory/reconciliations/reconciliations.validation.ts

import Joi from 'joi'

export const createReconciliationSchema = Joi.object({
  warehouseId: Joi.string().uuid().required(),
  source: Joi.string()
    .valid(
      'CYCLE_COUNT',
      'PHYSICAL_INVENTORY',
      'SYSTEM_ERROR',
      'ADJUSTMENT',
      'OTHER'
    )
    .required(),
  reason: Joi.string().max(500).required(),
  notes: Joi.string().max(500).optional(),
  items: Joi.array()
    .items(
      Joi.object({
        itemId: Joi.string().uuid().required(),
        systemQuantity: Joi.number().integer().min(0).required(),
        expectedQuantity: Joi.number().integer().min(0).required(),
        notes: Joi.string().max(255).optional(),
      })
    )
    .min(1)
    .required(),
})

export const updateReconciliationSchema = Joi.object({
  reason: Joi.string().max(500).optional(),
  notes: Joi.string().max(500).optional(),
  remarks: Joi.string().max(500).optional(),
}).min(1)

export const startReconciliationSchema = Joi.object({
  startedBy: Joi.string().required(),
})

export const completeReconciliationSchema = Joi.object({
  completedBy: Joi.string().required(),
})

export const approveReconciliationSchema = Joi.object({
  approvedBy: Joi.string().required(),
})

export const applyReconciliationSchema = Joi.object({
  appliedBy: Joi.string().required(),
})

export const addReconciliationItemSchema = Joi.object({
  itemId: Joi.string().uuid().required(),
  systemQuantity: Joi.number().integer().min(0).required(),
  expectedQuantity: Joi.number().integer().min(0).required(),
  notes: Joi.string().max(255).optional(),
})
