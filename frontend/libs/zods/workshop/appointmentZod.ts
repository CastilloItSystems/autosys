// libs/zods/workshop/appointmentZod.ts
import { z } from 'zod'

export const createAppointmentSchema = z.object({
  customerId: z.string({ required_error: 'El cliente es requerido' }).min(1, 'El cliente es requerido'),
  customerVehicleId: z.string().nullable().optional(),
  vehiclePlate: z.string().max(20).nullable().optional(),
  vehicleDesc: z.string().max(200).nullable().optional(),
  serviceTypeId: z.string().nullable().optional(),
  scheduledDate: z.string({ required_error: 'La fecha es requerida' }).min(1, 'La fecha es requerida'),
  estimatedMinutes: z.number({ invalid_type_error: 'Debe ser un número' }).int().min(1).nullable().optional(),
  assignedAdvisorId: z.string().nullable().optional(),
  clientNotes: z.string().max(1000).nullable().optional(),
  internalNotes: z.string().max(1000).nullable().optional(),
})

export const updateAppointmentSchema = z.object({
  customerVehicleId: z.string().nullable().optional(),
  vehiclePlate: z.string().max(20).nullable().optional(),
  vehicleDesc: z.string().max(200).nullable().optional(),
  serviceTypeId: z.string().nullable().optional(),
  scheduledDate: z.string().optional(),
  estimatedMinutes: z.number().int().min(1).nullable().optional(),
  assignedAdvisorId: z.string().nullable().optional(),
  clientNotes: z.string().max(1000).nullable().optional(),
  internalNotes: z.string().max(1000).nullable().optional(),
})

export type CreateAppointmentForm = z.infer<typeof createAppointmentSchema>
export type UpdateAppointmentForm = z.infer<typeof updateAppointmentSchema>
