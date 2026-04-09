// libs/zods/workshop/serviceTypeZod.ts
import { z } from 'zod'

export const createServiceTypeSchema = z.object({
  code: z.string().min(2, 'El código debe tener al menos 2 caracteres').max(20, 'Máximo 20 caracteres').toUpperCase(),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'Máximo 100 caracteres'),
  description: z.string().max(500, 'Máximo 500 caracteres').nullable().optional(),
  standardMinutes: z.number({ invalid_type_error: 'Debe ser un número' }).int().min(0).nullable().optional(),
  standardLaborPrice: z.number({ invalid_type_error: 'Debe ser un número' }).min(0).nullable().optional(),
})

export const updateServiceTypeSchema = createServiceTypeSchema.partial()

export type CreateServiceTypeForm = z.infer<typeof createServiceTypeSchema>
export type UpdateServiceTypeForm = z.infer<typeof updateServiceTypeSchema>
