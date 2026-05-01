// libs/zods/workshop/warrantyZod.ts
import { z } from 'zod'

const WARRANTY_TYPES = ['LABOR', 'PARTS', 'MIXED', 'COMMERCIAL'] as const
const WARRANTY_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CLOSED'] as const

export const createWarrantySchema = z.object({
  type: z.enum(WARRANTY_TYPES, { required_error: 'El tipo es requerido' }),
  originalOrderId: z.string({ required_error: 'La OT original es requerida' }).min(1),
  customerId: z.string({ required_error: 'El cliente es requerido' }).min(1),
  customerVehicleId: z.string().nullable().optional(),
  description: z.string().min(10, 'Mínimo 10 caracteres').max(2000),
  technicianId: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
})

export const updateWarrantySchema = z.object({
  rootCause: z.string().max(1000).nullable().optional(),
  resolution: z.string().max(2000).nullable().optional(),
  technicianId: z.string().nullable().optional(),
  reworkOrderId: z.string().nullable().optional(),
}).refine((d) => Object.values(d).some((v) => v !== undefined), {
  message: 'Debe proporcionar al menos un campo',
})

export const updateWarrantyStatusSchema = z.object({
  status: z.enum(WARRANTY_STATUSES, { required_error: 'El estado es requerido' }),
})

export type CreateWarrantyForm = z.infer<typeof createWarrantySchema>
export type UpdateWarrantyForm = z.infer<typeof updateWarrantySchema>
export type UpdateWarrantyStatusForm = z.infer<typeof updateWarrantyStatusSchema>
