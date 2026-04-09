// libs/zods/workshop/materialZod.ts
import { z } from 'zod'

export const createMaterialSchema = z.object({
  description: z.string().min(2, 'La descripción debe tener al menos 2 caracteres').max(500, 'Máximo 500 caracteres'),
  quantityRequested: z.number({ invalid_type_error: 'Debe ser un número' }).positive('Debe ser mayor a 0'),
  unitPrice: z.number({ invalid_type_error: 'Debe ser un número' }).min(0, 'No puede ser negativo'),
  unitCost: z.number({ invalid_type_error: 'Debe ser un número' }).min(0, 'No puede ser negativo').nullable().optional(),
  serviceOrderId: z.string().min(1, 'El ID de la orden de trabajo es requerido'),
  itemId: z.string().min(1, 'El ID del ítem no puede estar vacío').nullable().optional(),
})

export const updateMaterialSchema = createMaterialSchema.partial().extend({
  quantityReserved: z.number({ invalid_type_error: 'Debe ser un número' }).min(0).optional(),
  quantityDispatched: z.number({ invalid_type_error: 'Debe ser un número' }).min(0).optional(),
  quantityConsumed: z.number({ invalid_type_error: 'Debe ser un número' }).min(0).optional(),
  quantityReturned: z.number({ invalid_type_error: 'Debe ser un número' }).min(0).optional(),
  status: z.enum(['REQUESTED', 'RESERVED', 'DISPATCHED', 'CONSUMED', 'RETURNED', 'CANCELLED']).optional(),
})

export type CreateMaterialForm = z.infer<typeof createMaterialSchema>
export type UpdateMaterialForm = z.infer<typeof updateMaterialSchema>
