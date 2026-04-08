// libs/zods/workshop/serviceOrderZod.ts
import { z } from 'zod'

const itemSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['LABOR', 'PART', 'OTHER']),
  description: z.string().min(1, 'La descripción es requerida').max(500),
  quantity: z.number({ invalid_type_error: 'Debe ser un número' }).min(0.01, 'Debe ser > 0'),
  unitPrice: z.number({ invalid_type_error: 'Debe ser un número' }).min(0, 'Debe ser >= 0'),
  unitCost: z.number().min(0).default(0),
  discountPct: z.number().min(0).max(100).default(0),
  taxType: z.enum(['IVA', 'EXEMPT', 'REDUCED']).default('IVA'),
  taxRate: z.number().min(0).max(1).default(0.16),
  operationId: z.string().nullable().optional(),
  itemId: z.string().nullable().optional(),
  technicianId: z.string().nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
})

export const createServiceOrderSchema = z.object({
  customerId: z.string({ required_error: 'El cliente es requerido' }).min(1, 'El cliente es requerido'),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'ASAP']).default('NORMAL'),
  customerVehicleId: z.string().nullable().optional(),
  vehiclePlate: z.string().max(20).nullable().optional(),
  vehicleDesc: z.string().max(200).nullable().optional(),
  mileageIn: z.number({ invalid_type_error: 'Debe ser un número' }).int().min(0).nullable().optional(),
  serviceTypeId: z.string().nullable().optional(),
  bayId: z.string().nullable().optional(),
  assignedTechnicianId: z.string().nullable().optional(),
  receptionId: z.string().nullable().optional(),
  estimatedDelivery: z.string().nullable().optional(),
  diagnosisNotes: z.string().max(2000).nullable().optional(),
  observations: z.string().max(2000).nullable().optional(),
  items: z.array(itemSchema).default([]),
})

export const updateServiceOrderSchema = z.object({
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'ASAP']).optional(),
  customerVehicleId: z.string().nullable().optional(),
  vehiclePlate: z.string().max(20).nullable().optional(),
  vehicleDesc: z.string().max(200).nullable().optional(),
  mileageIn: z.number().int().min(0).nullable().optional(),
  mileageOut: z.number().int().min(0).nullable().optional(),
  serviceTypeId: z.string().nullable().optional(),
  bayId: z.string().nullable().optional(),
  assignedTechnicianId: z.string().nullable().optional(),
  assignedAdvisorId: z.string().nullable().optional(),
  estimatedDelivery: z.string().nullable().optional(),
  diagnosisNotes: z.string().max(2000).nullable().optional(),
  observations: z.string().max(2000).nullable().optional(),
  items: z.array(itemSchema).optional(),
})

export const updateStatusSchema = z.object({
  status: z.enum([
    'DRAFT', 'OPEN', 'DIAGNOSING', 'PENDING_APPROVAL', 'APPROVED',
    'IN_PROGRESS', 'PAUSED', 'WAITING_PARTS', 'WAITING_AUTH',
    'QUALITY_CHECK', 'READY', 'DELIVERED', 'INVOICED', 'CLOSED', 'CANCELLED',
  ], { required_error: 'El estado es requerido' }),
  mileageOut: z.number().int().min(0).optional(),
})

export type CreateServiceOrderForm = z.infer<typeof createServiceOrderSchema>
export type UpdateServiceOrderForm = z.infer<typeof updateServiceOrderSchema>
export type UpdateStatusForm = z.infer<typeof updateStatusSchema>
export type ServiceOrderItemForm = z.infer<typeof itemSchema>
