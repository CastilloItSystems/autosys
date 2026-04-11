// backend/src/features/workshop/workshopOperations/workshopOperations.validation.ts
import Joi from 'joi'

const DIFFICULTIES = ['BASIC', 'STANDARD', 'ADVANCED', 'SPECIALIST']

const suggestedMaterialSchema = Joi.object({
  itemId: Joi.string().optional().allow(null, ''),
  description: Joi.string().trim().max(300).required(),
  quantity: Joi.number().min(0).precision(2).default(1),
  isRequired: Joi.boolean().default(false),
  notes: Joi.string().trim().max(500).optional().allow('', null),
})

export const createWorkshopOperationSchema = Joi.object({
  code: Joi.string().trim().uppercase().min(2).max(20).required().messages({
    'string.empty': 'El código es requerido',
    'any.required': 'El código es requerido',
  }),
  name: Joi.string().trim().min(3).max(200).required().messages({
    'string.empty': 'El nombre es requerido',
    'any.required': 'El nombre es requerido',
  }),
  description: Joi.string().trim().max(2000).optional().allow(''),
  serviceTypeId: Joi.string().optional(),
  difficulty: Joi.string().valid(...DIFFICULTIES).default('STANDARD'),
  requiredSpecialtyId: Joi.string().optional(),
  standardMinutes: Joi.number().integer().min(1).optional(),
  minMinutes: Joi.number().integer().min(1).optional(),
  maxMinutes: Joi.number().integer().min(1).optional(),
  listPrice: Joi.number().min(0).precision(2).default(0),
  costPrice: Joi.number().min(0).precision(2).default(0),
  warrantyDays: Joi.number().integer().min(0).optional(),
  warrantyKm: Joi.number().integer().min(0).optional(),
  requiredEquipment: Joi.string().trim().max(500).optional().allow(''),
  procedure: Joi.string().trim().max(5000).optional().allow(''),
  isExternalService: Joi.boolean().default(false),
  tags: Joi.array().items(Joi.string().trim().max(50)).default([]),
  suggestedMaterials: Joi.array().items(suggestedMaterialSchema).optional(),
})

export const updateWorkshopOperationSchema = Joi.object({
  code: Joi.string().trim().uppercase().min(2).max(20).optional(),
  name: Joi.string().trim().min(3).max(200).optional(),
  description: Joi.string().trim().max(2000).optional().allow('', null),
  serviceTypeId: Joi.string().optional().allow(null),
  difficulty: Joi.string().valid(...DIFFICULTIES).optional(),
  requiredSpecialtyId: Joi.string().optional().allow(null),
  standardMinutes: Joi.number().integer().min(1).optional().allow(null),
  minMinutes: Joi.number().integer().min(1).optional().allow(null),
  maxMinutes: Joi.number().integer().min(1).optional().allow(null),
  listPrice: Joi.number().min(0).precision(2).optional(),
  costPrice: Joi.number().min(0).precision(2).optional(),
  warrantyDays: Joi.number().integer().min(0).optional().allow(null),
  warrantyKm: Joi.number().integer().min(0).optional().allow(null),
  requiredEquipment: Joi.string().trim().max(500).optional().allow('', null),
  procedure: Joi.string().trim().max(5000).optional().allow('', null),
  isExternalService: Joi.boolean().optional(),
  tags: Joi.array().items(Joi.string().trim().max(50)).optional(),
  suggestedMaterials: Joi.array().items(suggestedMaterialSchema).optional(),
}).min(1).messages({ 'object.min': 'Debe proporcionar al menos un campo para actualizar' })

export const workshopOperationFiltersSchema = Joi.object({
  search: Joi.string().trim().optional().allow(''),
  serviceTypeId: Joi.string().optional(),
  difficulty: Joi.string().valid(...DIFFICULTIES).optional(),
  requiredSpecialtyId: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid('code', 'name', 'listPrice', 'difficulty', 'createdAt').default('name'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
})
