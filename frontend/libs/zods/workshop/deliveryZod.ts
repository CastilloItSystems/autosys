// libs/zods/workshop/deliveryZod.ts
import { z } from 'zod'

export const createDeliverySchema = z.object({
  serviceOrderId: z.string().min(1, 'La orden de servicio es requerida'),
  deliveredBy: z.string().min(1, 'El nombre de quien entrega es requerido'),
  receivedByName: z.string().min(1, 'El nombre de quien recibe es requerido'),
  clientConformity: z.boolean().default(true),
  observations: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
  nextVisitDate: z.string().optional(),
})

export const updateDeliverySchema = createDeliverySchema.partial()

export type CreateDeliveryForm = z.infer<typeof createDeliverySchema>
export type UpdateDeliveryForm = z.infer<typeof updateDeliverySchema>
