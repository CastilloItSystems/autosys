// backend/src/features/workshop/postRepairScans/postRepairScans.validation.ts
import Joi from 'joi'

export const createPostRepairScanSchema = Joi.object({
  serviceOrderId: Joi.string().required(),
  technicianId: Joi.string().required(),
  technicianName: Joi.string().allow('', null).optional(),
  dtcCodesCleared: Joi.any().optional(),
  parametersVerified: Joi.any().optional(),
  result: Joi.string().valid('PASS', 'FAIL', 'WITH_OBSERVATIONS').required(),
  reportUrl: Joi.string().allow('', null).optional(),
  reportPrinted: Joi.boolean().optional(),
  observations: Joi.string().allow('', null).optional(),
})

export const updatePostRepairScanSchema = Joi.object({
  technicianId: Joi.string().optional(),
  technicianName: Joi.string().allow('', null).optional(),
  dtcCodesCleared: Joi.any().optional(),
  parametersVerified: Joi.any().optional(),
  result: Joi.string().valid('PASS', 'FAIL', 'WITH_OBSERVATIONS').optional(),
  reportUrl: Joi.string().allow('', null).optional(),
  reportPrinted: Joi.boolean().optional(),
  observations: Joi.string().allow('', null).optional(),
})
