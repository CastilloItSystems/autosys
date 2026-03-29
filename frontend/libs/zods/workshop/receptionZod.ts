// libs/zods/workshop/receptionZod.ts
import { z } from 'zod'

const FUEL_LEVELS = ['EMPTY', 'QUARTER', 'HALF', 'THREE_QUARTERS', 'FULL'] as const

export const createReceptionSchema = z.object({
  customerId: z.string({ required_error: 'El cliente es requerido' }).min(1, 'El cliente es requerido'),
  customerVehicleId: z.string().nullable().optional(),
  vehiclePlate: z.string().max(20).nullable().optional(),
  vehicleDesc: z.string().max(200).nullable().optional(),
  mileageIn: z.number({ invalid_type_error: 'Debe ser un número' }).int().min(0).nullable().optional(),
  fuelLevel: z.enum(FUEL_LEVELS).nullable().optional(),
  accessories: z.array(z.string()).default([]),
  hasPreExistingDamage: z.boolean().default(false),
  damageNotes: z.string().max(1000).nullable().optional(),
  clientDescription: z.string().max(2000).nullable().optional(),
  authorizationName: z.string().max(100).nullable().optional(),
  authorizationPhone: z.string().max(20).nullable().optional(),
  estimatedDelivery: z.string().nullable().optional(),
  advisorId: z.string().nullable().optional(),
  appointmentId: z.string().nullable().optional(),
})

export const updateReceptionSchema = z.object({
  mileageIn: z.number().int().min(0).nullable().optional(),
  fuelLevel: z.enum(FUEL_LEVELS).nullable().optional(),
  accessories: z.array(z.string()).optional(),
  hasPreExistingDamage: z.boolean().optional(),
  damageNotes: z.string().max(1000).nullable().optional(),
  clientDescription: z.string().max(2000).nullable().optional(),
  authorizationName: z.string().max(100).nullable().optional(),
  authorizationPhone: z.string().max(20).nullable().optional(),
  estimatedDelivery: z.string().nullable().optional(),
  advisorId: z.string().nullable().optional(),
})

export type CreateReceptionForm = z.infer<typeof createReceptionSchema>
export type UpdateReceptionForm = z.infer<typeof updateReceptionSchema>
