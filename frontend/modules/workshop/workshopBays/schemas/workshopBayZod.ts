// libs/zods/workshop/workshopBayZod.ts
import { z } from 'zod'

export const createWorkshopBaySchema = z.object({
  code: z.string().min(2, 'El código debe tener al menos 2 caracteres').max(20, 'Máximo 20 caracteres').toUpperCase(),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'Máximo 100 caracteres'),
  description: z.string().max(500, 'Máximo 500 caracteres').nullable().optional(),
})

export const updateWorkshopBaySchema = createWorkshopBaySchema.partial()

export type CreateWorkshopBayForm = z.infer<typeof createWorkshopBaySchema>
export type UpdateWorkshopBayForm = z.infer<typeof updateWorkshopBaySchema>
