// libs/zods/workshop/diagnosisZod.ts
import { z } from 'zod'

const severityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], {
  errorMap: () => ({ message: 'Severidad inválida' }),
})

const statusEnum = z.enum(['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'APPROVED'], {
  errorMap: () => ({ message: 'Estado inválido' }),
})

export const createDiagnosisSchema = z.object({
  receptionId: z.string().uuid('ID de recepción inválido').optional(),
  serviceOrderId: z.string().uuid('ID de orden de servicio inválido').optional(),
  technicianId: z.string().uuid('ID de técnico inválido').optional(),
  generalNotes: z.string().max(2000, 'Máximo 2000 caracteres').optional(),
  severity: severityEnum.optional(),
})

export const updateDiagnosisSchema = createDiagnosisSchema.partial().extend({
  status: statusEnum.optional(),
})

export const createFindingSchema = z.object({
  category: z.string().max(100, 'Máximo 100 caracteres').optional(),
  description: z.string().min(1, 'La descripción es requerida').max(1000, 'Máximo 1000 caracteres'),
  severity: severityEnum,
  requiresClientAuth: z.boolean().optional().default(false),
  observation: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
})

export const createSuggestedOpSchema = z.object({
  operationId: z.string().uuid('ID de operación inválido').optional(),
  description: z.string().min(1, 'La descripción es requerida').max(500, 'Máximo 500 caracteres'),
  estimatedMins: z.number({ invalid_type_error: 'Debe ser un número' }).int().min(0).optional(),
  estimatedPrice: z.number({ invalid_type_error: 'Debe ser un número' }).min(0).optional(),
})

export const createSuggestedPartSchema = z.object({
  itemId: z.string().uuid('ID de artículo inválido').optional(),
  description: z.string().min(1, 'La descripción es requerida').max(500, 'Máximo 500 caracteres'),
  quantity: z.number({ invalid_type_error: 'Debe ser un número' }).min(0).optional(),
  estimatedCost: z.number({ invalid_type_error: 'Debe ser un número' }).min(0).optional(),
  estimatedPrice: z.number({ invalid_type_error: 'Debe ser un número' }).min(0).optional(),
})

export type CreateDiagnosisForm = z.infer<typeof createDiagnosisSchema>
export type UpdateDiagnosisForm = z.infer<typeof updateDiagnosisSchema>
export type CreateFindingForm = z.infer<typeof createFindingSchema>
export type CreateSuggestedOpForm = z.infer<typeof createSuggestedOpSchema>
export type CreateSuggestedPartForm = z.infer<typeof createSuggestedPartSchema>
