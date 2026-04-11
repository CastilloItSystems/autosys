// libs/zods/workshop/workshopOperationZod.ts
import { z } from 'zod'

export const DIFFICULTY_OPTIONS = [
  { value: 'BASIC', label: 'Básica' },
  { value: 'STANDARD', label: 'Estándar' },
  { value: 'ADVANCED', label: 'Avanzada' },
  { value: 'SPECIALIST', label: 'Especialista' },
] as const

const suggestedMaterialSchema = z.object({
  itemId: z.string().nullable().optional(),
  description: z.string().min(1, 'La descripción es requerida').max(300),
  quantity: z.number({ invalid_type_error: 'Debe ser un número' }).min(0).default(1),
  isRequired: z.boolean().default(false),
  notes: z.string().max(500).nullable().optional(),
})

export const createWorkshopOperationSchema = z.object({
  code: z.string().min(2, 'Mínimo 2 caracteres').max(20, 'Máximo 20 caracteres').toUpperCase(),
  name: z.string().min(2, 'Mínimo 2 caracteres').max(200, 'Máximo 200 caracteres'),
  description: z.string().max(2000).nullable().optional(),
  serviceTypeId: z.string().nullable().optional(),
  difficulty: z.enum(['BASIC', 'STANDARD', 'ADVANCED', 'SPECIALIST']).default('STANDARD'),
  requiredSpecialtyId: z.string().nullable().optional(),
  standardMinutes: z.number({ invalid_type_error: 'Debe ser un número' }).int().min(0).nullable().optional(),
  minMinutes: z.number({ invalid_type_error: 'Debe ser un número' }).int().min(0).nullable().optional(),
  maxMinutes: z.number({ invalid_type_error: 'Debe ser un número' }).int().min(0).nullable().optional(),
  listPrice: z.number({ invalid_type_error: 'Debe ser un número' }).min(0, 'Debe ser >= 0'),
  costPrice: z.number({ invalid_type_error: 'Debe ser un número' }).min(0, 'Debe ser >= 0').default(0),
  warrantyDays: z.number({ invalid_type_error: 'Debe ser un número' }).int().min(0).nullable().optional(),
  warrantyKm: z.number({ invalid_type_error: 'Debe ser un número' }).int().min(0).nullable().optional(),
  requiredEquipment: z.string().max(500).nullable().optional(),
  procedure: z.string().max(5000).nullable().optional(),
  isExternalService: z.boolean().default(false),
  tags: z.array(z.string().max(50)).default([]),
  suggestedMaterials: z.array(suggestedMaterialSchema).default([]),
})

export const updateWorkshopOperationSchema = createWorkshopOperationSchema.partial()

export type CreateWorkshopOperationForm = z.infer<typeof createWorkshopOperationSchema>
export type UpdateWorkshopOperationForm = z.infer<typeof updateWorkshopOperationSchema>
export type SuggestedMaterialForm = z.infer<typeof suggestedMaterialSchema>
