// libs/zods/workshop/workshopOperationZod.ts
import { z } from 'zod'

export const createWorkshopOperationSchema = z.object({
  code: z.string().min(2, 'El código debe tener al menos 2 caracteres').max(20, 'Máximo 20 caracteres').toUpperCase(),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'Máximo 100 caracteres'),
  description: z.string().max(500, 'Máximo 500 caracteres').nullable().optional(),
  serviceTypeId: z.string().nullable().optional(),
  standardMinutes: z.number({ invalid_type_error: 'Debe ser un número' }).int().min(0).nullable().optional(),
  listPrice: z.number({ invalid_type_error: 'Debe ser un número' }).min(0, 'El precio debe ser >= 0'),
})

export const updateWorkshopOperationSchema = createWorkshopOperationSchema.partial()

export type CreateWorkshopOperationForm = z.infer<typeof createWorkshopOperationSchema>
export type UpdateWorkshopOperationForm = z.infer<typeof updateWorkshopOperationSchema>
