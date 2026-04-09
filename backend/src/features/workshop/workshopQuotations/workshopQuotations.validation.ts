// backend/src/features/workshop/workshopQuotations/workshopQuotations.validation.ts
import Joi from 'joi'

const QUOTATION_STATUSES = [
  'DRAFT', 'ISSUED', 'SENT', 'PENDING_APPROVAL',
  'APPROVED_TOTAL', 'APPROVED_PARTIAL', 'REJECTED', 'EXPIRED', 'CONVERTED',
]
const ITEM_TYPES = ['LABOR', 'PART', 'CONSUMABLE', 'EXTERNAL_SERVICE', 'COURTESY']
const APPROVAL_CHANNELS = ['PRESENTIAL', 'WHATSAPP', 'EMAIL', 'CALL', 'DIGITAL_SIGNATURE']
const APPROVAL_TYPES = ['TOTAL', 'PARTIAL', 'REJECTION']

const itemSchema = Joi.object({
  id: Joi.string().optional(),
  type: Joi.string().valid(...ITEM_TYPES).required().messages({
    'any.only': `El tipo de ítem debe ser uno de: ${ITEM_TYPES.join(', ')}`,
    'any.required': 'El tipo de ítem es requerido',
  }),
  referenceId: Joi.string().optional().allow(null, ''),
  description: Joi.string().trim().min(2).max(500).required().messages({
    'any.required': 'La descripción del ítem es requerida',
    'string.min': 'La descripción debe tener al menos 2 caracteres',
  }),
  quantity: Joi.number().positive().required().messages({
    'any.required': 'La cantidad es requerida',
    'number.positive': 'La cantidad debe ser mayor a 0',
  }),
  unitPrice: Joi.number().min(0).required().messages({
    'any.required': 'El precio unitario es requerido',
    'number.min': 'El precio unitario no puede ser negativo',
  }),
  unitCost: Joi.number().min(0).optional().default(0),
  discount: Joi.number().min(0).optional().default(0),
  tax: Joi.number().min(0).optional().default(0),
  approved: Joi.boolean().optional().default(true),
  order: Joi.number().integer().min(0).optional().default(0),
})

export const createQuotationSchema = Joi.object({
  receptionId: Joi.string().optional().allow(null, ''),
  diagnosisId: Joi.string().optional().allow(null, ''),
  customerId: Joi.string().required().messages({ 'any.required': 'El cliente es requerido' }),
  customerVehicleId: Joi.string().optional().allow(null, ''),
  isSupplementary: Joi.boolean().optional().default(false),
  parentQuotationId: Joi.string().optional().allow(null, ''),
  validUntil: Joi.date().iso().optional(),
  notes: Joi.string().trim().max(2000).optional().allow(''),
  internalNotes: Joi.string().trim().max(2000).optional().allow(''),
  items: Joi.array().items(itemSchema).min(1).required().messages({
    'any.required': 'Debe incluir al menos un ítem en la cotización',
    'array.min': 'Debe incluir al menos un ítem en la cotización',
  }),
})

export const updateQuotationSchema = Joi.object({
  validUntil: Joi.date().iso().optional().allow(null),
  notes: Joi.string().trim().max(2000).optional().allow('', null),
  internalNotes: Joi.string().trim().max(2000).optional().allow('', null),
  items: Joi.array().items(itemSchema).min(1).optional(),
}).min(1).messages({ 'object.min': 'Debe proporcionar al menos un campo para actualizar' })

export const updateQuotationStatusSchema = Joi.object({
  status: Joi.string().valid(...QUOTATION_STATUSES).required().messages({
    'any.required': 'El estado es requerido',
    'any.only': `El estado debe ser uno de: ${QUOTATION_STATUSES.join(', ')}`,
  }),
})

export const registerApprovalSchema = Joi.object({
  type: Joi.string().valid(...APPROVAL_TYPES).required().messages({
    'any.required': 'El tipo de aprobación es requerido',
    'any.only': `El tipo debe ser: ${APPROVAL_TYPES.join(', ')}`,
  }),
  channel: Joi.string().valid(...APPROVAL_CHANNELS).required().messages({
    'any.required': 'El canal de aprobación es requerido',
    'any.only': `El canal debe ser uno de: ${APPROVAL_CHANNELS.join(', ')}`,
  }),
  approvedByName: Joi.string().trim().min(2).max(200).required().messages({
    'any.required': 'El nombre del aprobador es requerido',
  }),
  notes: Joi.string().trim().max(1000).optional().allow(''),
  rejectionReason: Joi.string().trim().max(1000).optional().allow(''),
  approvedItemIds: Joi.array().items(Joi.string()).optional(),
})

export const convertToSOSchema = Joi.object({
  advisorId: Joi.string().optional().allow(null, ''),
  branchId: Joi.string().optional().allow(null, ''),
  notes: Joi.string().trim().max(1000).optional().allow(''),
})

export const quotationFiltersSchema = Joi.object({
  status: Joi.string().valid(...QUOTATION_STATUSES).optional(),
  customerId: Joi.string().optional(),
  receptionId: Joi.string().optional(),
  isSupplementary: Joi.boolean().optional(),
  search: Joi.string().trim().optional().allow(''),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid('quotationNumber', 'createdAt', 'validUntil', 'total').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
})
