// libs/zods/workshop/garitaZod.ts
import { z } from 'zod'

export const GARITA_EVENT_TYPES = [
  'VEHICLE_IN', 'VEHICLE_OUT', 'PART_OUT', 'PART_IN', 'ROAD_TEST_OUT', 'ROAD_TEST_IN', 'OTHER'
] as const

export const GARITA_EVENT_STATUSES = [
  'PENDING', 'AUTHORIZED', 'COMPLETED', 'FLAGGED', 'CANCELLED'
] as const

export const GARITA_TYPE_LABELS: Record<string, string> = {
  VEHICLE_IN:    'Ingreso vehículo',
  VEHICLE_OUT:   'Egreso vehículo',
  PART_OUT:      'Salida de pieza (T.O.T.)',
  PART_IN:       'Reingreso de pieza (T.O.T.)',
  ROAD_TEST_OUT: 'Salida prueba de carretera',
  ROAD_TEST_IN:  'Reingreso prueba de carretera',
  OTHER:         'Otro',
}

export const createGaritaEventSchema = z.object({
  type: z.enum(GARITA_EVENT_TYPES),
  serviceOrderId: z.string().nullable().optional(),
  totId: z.string().nullable().optional(),
  plateNumber: z.string().max(20).nullable().optional(),
  vehicleDesc: z.string().max(200).nullable().optional(),
  serialMotor: z.string().max(100).nullable().optional(),
  serialBody: z.string().max(100).nullable().optional(),
  kmIn: z.number().int().min(0).nullable().optional(),
  driverName: z.string().max(200).nullable().optional(),
  driverId: z.string().max(30).nullable().optional(),
  exitPassRef: z.string().max(100).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  eventAt: z.string().nullable().optional(),
})

export const updateGaritaStatusSchema = z.object({
  status: z.enum(GARITA_EVENT_STATUSES),
  kmOut: z.number().int().min(0).nullable().optional(),
  exitPassRef: z.string().max(100).nullable().optional(),
  irregularityNotes: z.string().max(2000).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
})

export type CreateGaritaFormValues = z.infer<typeof createGaritaEventSchema>
export type UpdateGaritaStatusFormValues = z.infer<typeof updateGaritaStatusSchema>
