// libs/zods/workshop/ingressMotiveZod.ts
import { z } from 'zod'

export const createIngressMotiveSchema = z.object({
  code: z.string().min(2, 'El código debe tener al menos 2 caracteres').max(20, 'Máximo 20 caracteres').toUpperCase(),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'Máximo 100 caracteres'),
  description: z.string().max(500, 'Máximo 500 caracteres').nullable().optional(),
})

export const updateIngressMotiveSchema = createIngressMotiveSchema.partial().extend({
  isActive: z.boolean().optional(),
})

export type CreateIngressMotiveForm = z.infer<typeof createIngressMotiveSchema>
export type UpdateIngressMotiveForm = z.infer<typeof updateIngressMotiveSchema>
