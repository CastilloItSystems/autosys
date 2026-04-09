// backend/src/features/workshop/checklists/checklists.validation.ts
import Joi from 'joi'

const CHECKLIST_CATEGORIES = ['RECEPTION', 'DIAGNOSIS', 'QUALITY_CONTROL']
const CHECKLIST_ITEM_TYPES = ['BOOLEAN', 'TEXT', 'NUMBER', 'SELECTION']

export const createChecklistTemplateSchema = Joi.object({
  code: Joi.string()
    .trim()
    .required()
    .messages({ 'any.required': 'El código es requerido' }),
  name: Joi.string()
    .trim()
    .required()
    .messages({ 'any.required': 'El nombre es requerido' }),
  description: Joi.string().trim().optional().allow(null, ''),
  category: Joi.string()
    .valid(...CHECKLIST_CATEGORIES)
    .required()
    .messages({
      'any.required': 'La categoría es requerida',
      'any.only': `La categoría debe ser una de: ${CHECKLIST_CATEGORIES.join(', ')}`,
    }),
  items: Joi.array()
    .items(
      Joi.object({
        code: Joi.string()
          .trim()
          .required()
          .messages({ 'any.required': 'El código del ítem es requerido' }),
        name: Joi.string()
          .trim()
          .required()
          .messages({ 'any.required': 'El nombre del ítem es requerido' }),
        description: Joi.string().trim().optional().allow(null, ''),
        responseType: Joi.string()
          .valid(...CHECKLIST_ITEM_TYPES)
          .optional()
          .default('BOOLEAN'),
        isRequired: Joi.boolean().optional().default(false),
        order: Joi.number().integer().min(0).optional().default(0),
        options: Joi.any().optional(),
      })
    )
    .optional()
    .default([]),
})

export const updateChecklistTemplateSchema = Joi.object({
  code: Joi.string().trim().optional(),
  name: Joi.string().trim().optional(),
  description: Joi.string().trim().optional().allow(null, ''),
  category: Joi.string()
    .valid(...CHECKLIST_CATEGORIES)
    .optional(),
  isActive: Joi.boolean().optional(),
  items: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().optional(),
        code: Joi.string().trim().optional(),
        name: Joi.string().trim().optional(),
        description: Joi.string().trim().optional().allow(null, ''),
        responseType: Joi.string()
          .valid(...CHECKLIST_ITEM_TYPES)
          .optional(),
        isRequired: Joi.boolean().optional(),
        order: Joi.number().integer().min(0).optional(),
        options: Joi.any().optional(),
        isActive: Joi.boolean().optional(),
      })
    )
    .optional(),
})
  .min(1)
  .messages({
    'object.min': 'Debe proporcionar al menos un campo para actualizar',
  })

export const checklistFiltersSchema = Joi.object({
  search: Joi.string().trim().optional().allow(''),
  isActive: Joi.boolean().optional(),
  category: Joi.string()
    .valid(...CHECKLIST_CATEGORIES)
    .optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid('name', 'code', 'createdAt').default('name'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
})

// FASE 3.3: Conditional Rules validation schemas
export const conditionalRuleSchema = Joi.object({
  id: Joi.string().required(),
  condition: Joi.object({
    itemId: Joi.string().required(),
    valueEquals: Joi.any().required(), // Can be boolean, string, or number
  }).required(),
  action: Joi.object({
    requiredItemIds: Joi.array().items(Joi.string()).required(),
  }).required(),
})

export const conditionalRulesPayloadSchema = Joi.object({
  rules: Joi.array().items(conditionalRuleSchema).required(),
})

export const checklistResponseSchema = Joi.object({
  checklistItemId: Joi.string().required(),
  boolValue: Joi.boolean().optional(),
  textValue: Joi.string().optional(),
  numValue: Joi.number().optional(),
  selectionValue: Joi.string().optional(),
  observation: Joi.string().optional(),
})

export const evaluateConditionalsSchema = Joi.object({
  responses: Joi.array().items(checklistResponseSchema).required().messages({
    'array.base': 'responses debe ser un array',
    'any.required': 'responses es requerido',
  }),
})
