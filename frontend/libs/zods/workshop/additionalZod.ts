// libs/zods/workshop/additionalZod.ts
import { z } from 'zod'

const ADDITIONAL_ITEM_TYPES = ['LABOR', 'PART', 'OTHER'] as const

export const additionalItemSchema = z.object({
  id: z.string().optional(),
  type: z.enum(ADDITIONAL_ITEM_TYPES, { errorMap: () => ({ message: 'Tipo de ítem inválido' }) }),
  description: z.string().min(2, 'La descripción debe tener al menos 2 caracteres'),
  quantity: z.number({ invalid_type_error: 'La cantidad es requerida' }).positive('La cantidad debe ser mayor a 0'),
  unitPrice: z.number({ invalid_type_error: 'El precio es requerido' }).min(0, 'El precio no puede ser negativo'),
  unitCost: z.number().min(0).optional().default(0),
})

export const createAdditionalSchema = z.object({
  description: z.string().min(2, 'La descripción debe tener al menos 2 caracteres').max(500, 'Máximo 500 caracteres'),
  serviceOrderId: z.string().min(1, 'El ID de la orden de trabajo es requerido'),
  items: z.array(additionalItemSchema).optional().default([]),
})

export const updateAdditionalSchema = z.object({
  description: z.string().min(2, 'La descripción debe tener al menos 2 caracteres').max(500, 'Máximo 500 caracteres').optional(),
  serviceOrderId: z.string().min(1, 'El ID de la orden de trabajo es requerido').optional(),
  status: z.enum(['PROPOSED', 'QUOTED', 'APPROVED', 'EXECUTED', 'REJECTED']).optional(),
  items: z.array(additionalItemSchema).optional(),
})

export type AdditionalItemFormValues = z.infer<typeof additionalItemSchema>
export type CreateAdditionalForm = z.infer<typeof createAdditionalSchema>
export type UpdateAdditionalForm = z.infer<typeof updateAdditionalSchema>
