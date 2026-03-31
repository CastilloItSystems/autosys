// libs/zods/workshop/additionalZod.ts
import { z } from 'zod'

export const createAdditionalSchema = z.object({
  description: z.string().min(2, 'La descripción debe tener al menos 2 caracteres').max(500, 'Máximo 500 caracteres'),
  estimatedPrice: z.number({ invalid_type_error: 'Debe ser un número' }).min(0, 'No puede ser negativo'),
  serviceOrderId: z.string().min(1, 'El ID de la orden de trabajo es requerido'),
})

export const updateAdditionalSchema = createAdditionalSchema.partial().extend({
  status: z.enum(['PROPOSED', 'QUOTED', 'APPROVED', 'EXECUTED', 'REJECTED']).optional(),
})

export type CreateAdditionalForm = z.infer<typeof createAdditionalSchema>
export type UpdateAdditionalForm = z.infer<typeof updateAdditionalSchema>
