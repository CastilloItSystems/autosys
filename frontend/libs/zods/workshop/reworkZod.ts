// libs/zods/workshop/reworkZod.ts
import { z } from 'zod'

export const createReworkSchema = z.object({
  originalOrderId: z.string().min(1, 'La orden de trabajo original es requerida'),
  motive: z.string().min(5, 'Describa el motivo del retrabajo (mínimo 5 caracteres)').max(500, 'Máximo 500 caracteres'),
  rootCause: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
  technicianId: z.string().optional(),
  estimatedCost: z.number({ invalid_type_error: 'Debe ser un número' }).min(0, 'El costo no puede ser negativo').optional(),
  notes: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
})

export const updateReworkSchema = z.object({
  rootCause: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
  technicianId: z.string().optional(),
  estimatedCost: z.number({ invalid_type_error: 'Debe ser un número' }).min(0).optional(),
  realCost: z.number({ invalid_type_error: 'Debe ser un número' }).min(0).optional(),
  notes: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
  reworkOrderId: z.string().optional(),
})

export const changeReworkStatusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
})

export type CreateReworkForm = z.infer<typeof createReworkSchema>
export type UpdateReworkForm = z.infer<typeof updateReworkSchema>
export type ChangeReworkStatusForm = z.infer<typeof changeReworkStatusSchema>
