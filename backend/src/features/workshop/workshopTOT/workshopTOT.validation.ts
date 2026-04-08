// backend/src/features/workshop/workshopTOT/workshopTOT.validation.ts
import Joi from 'joi'

const TOT_STATUSES = ['REQUESTED', 'APPROVED', 'DEPARTED', 'IN_PROGRESS', 'RETURNED', 'INVOICED', 'CANCELLED']
const TOT_DOCUMENT_TYPES = ['PROVIDER_QUOTE', 'DELIVERY_ACT', 'RETURN_ACT', 'PROVIDER_INVOICE', 'OTHER']

export const createTOTSchema = Joi.object({
  serviceOrderId: Joi.string().required().messages({ 'any.required': 'La orden de servicio es requerida' }),
  supplierId: Joi.string().optional().allow(null, ''),
  providerName: Joi.string().trim().max(200).optional().allow('', null),
  partDescription: Joi.string().trim().max(1000).required().messages({ 'any.required': 'La descripción de la pieza es requerida' }),
  partSerial: Joi.string().trim().max(100).optional().allow('', null),
  photoUrls: Joi.array().items(Joi.string().uri()).optional().allow(null),
  requestedWork: Joi.string().trim().max(2000).required().messages({ 'any.required': 'El trabajo solicitado es requerido' }),
  technicalInstruction: Joi.string().trim().max(2000).optional().allow('', null),
  estimatedReturnAt: Joi.date().iso().optional().allow(null),
  providerQuote: Joi.number().min(0).optional().allow(null),
  notes: Joi.string().trim().max(2000).optional().allow('', null),
})

export const updateTOTSchema = Joi.object({
  supplierId: Joi.string().optional().allow(null, ''),
  providerName: Joi.string().trim().max(200).optional().allow('', null),
  partDescription: Joi.string().trim().max(1000).optional(),
  partSerial: Joi.string().trim().max(100).optional().allow('', null),
  photoUrls: Joi.array().items(Joi.string().uri()).optional().allow(null),
  requestedWork: Joi.string().trim().max(2000).optional(),
  technicalInstruction: Joi.string().trim().max(2000).optional().allow('', null),
  approvedById: Joi.string().optional().allow(null, ''),
  departureRef: Joi.string().trim().max(100).optional().allow('', null),
  departedAt: Joi.date().iso().optional().allow(null),
  estimatedReturnAt: Joi.date().iso().optional().allow(null),
  returnedAt: Joi.date().iso().optional().allow(null),
  providerQuote: Joi.number().min(0).optional().allow(null),
  finalCost: Joi.number().min(0).optional().allow(null),
  providerInvoiceRef: Joi.string().trim().max(100).optional().allow('', null),
  notes: Joi.string().trim().max(2000).optional().allow('', null),
}).min(1).messages({ 'object.min': 'Debe proporcionar al menos un campo para actualizar' })

export const updateTOTStatusSchema = Joi.object({
  status: Joi.string().valid(...TOT_STATUSES).required().messages({ 'any.required': 'El estado es requerido' }),
  notes: Joi.string().trim().max(500).optional().allow('', null),
})

export const addTOTDocumentSchema = Joi.object({
  type: Joi.string().valid(...TOT_DOCUMENT_TYPES).required().messages({ 'any.required': 'El tipo de documento es requerido' }),
  url: Joi.string().uri().required().messages({ 'any.required': 'La URL del documento es requerida' }),
  description: Joi.string().trim().max(500).optional().allow('', null),
})

export const totFiltersSchema = Joi.object({
  status: Joi.string().valid(...TOT_STATUSES).optional(),
  serviceOrderId: Joi.string().optional(),
  supplierId: Joi.string().optional(),
  search: Joi.string().trim().optional().allow(''),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
})
