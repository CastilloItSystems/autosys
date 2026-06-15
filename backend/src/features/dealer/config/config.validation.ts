import Joi from 'joi'

export const upsertDealerPolicySchema = Joi.object({
  quoteValidityDays: Joi.number().integer().min(1).max(365).optional(),
  reservationValidityDays: Joi.number().integer().min(1).max(365).optional(),
  minDepositAmount: Joi.number().min(0).optional().allow(null),
  minDepositPct: Joi.number().min(0).max(100).optional().allow(null),
  maxDiscountPctAdvisor: Joi.number().min(0).max(100).optional(),
  maxDiscountPctSupervisor: Joi.number().min(0).max(100).optional(),
  maxDiscountPctManager: Joi.number().min(0).max(100).optional(),
  requireTestDrive: Joi.boolean().optional(),
  requireAppraisalForTradeIn: Joi.boolean().optional(),
  requireDepositForReservation: Joi.boolean().optional(),
  leadFollowUpSlaHours: Joi.number().integer().min(1).max(2160).optional(),
  commissionPctDefault: Joi.number().min(0).max(100).optional(),
  alertWindowHours: Joi.number().integer().min(1).max(720).optional(),
  notes: Joi.string().max(1000).optional().allow(null, ''),
  isActive: Joi.boolean().optional(),
}).messages({
  'number.base': 'El valor debe ser numérico',
  'number.min': 'El valor no puede ser menor al mínimo permitido',
  'number.max': 'El valor excede el máximo permitido',
})
