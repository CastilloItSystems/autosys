// libs/zods/workshop/quotationZod.ts
import { z } from 'zod'

const ITEM_TYPES = ['LABOR', 'PART', 'CONSUMABLE', 'EXTERNAL_SERVICE', 'COURTESY'] as const
const APPROVAL_CHANNELS = ['PRESENTIAL', 'WHATSAPP', 'EMAIL', 'CALL', 'DIGITAL_SIGNATURE'] as const
const APPROVAL_TYPES = ['TOTAL', 'PARTIAL', 'REJECTION'] as const

export const quotationItemSchema = z.object({
  id: z.string().optional(),
  type: z.enum(ITEM_TYPES, { errorMap: () => ({ message: 'Tipo de ítem inválido' }) }),
  referenceId: z.string().optional().nullable(),
  description: z.string().min(2, 'La descripción debe tener al menos 2 caracteres'),
  quantity: z.number({ invalid_type_error: 'La cantidad es requerida' }).positive('La cantidad debe ser mayor a 0'),
  unitPrice: z.number({ invalid_type_error: 'El precio es requerido' }).min(0, 'El precio no puede ser negativo'),
  unitCost: z.number().min(0).optional().default(0),
  discount: z.number().min(0).optional().default(0),
  tax: z.number().min(0).optional().default(0),
  approved: z.boolean().optional().default(true),
  order: z.number().int().min(0).optional().default(0),
})

export const createQuotationSchema = z.object({
  receptionId: z.string().optional().nullable(),
  diagnosisId: z.string().optional().nullable(),
  customerId: z.string().min(1, 'El cliente es requerido'),
  customerVehicleId: z.string().optional().nullable(),
  isSupplementary: z.boolean().optional().default(false),
  parentQuotationId: z.string().optional().nullable(),
  validUntil: z.string().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  internalNotes: z.string().max(2000).optional().nullable(),
  items: z.array(quotationItemSchema).min(1, 'Debe agregar al menos un ítem'),
})

export const updateQuotationSchema = z.object({
  validUntil: z.string().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  internalNotes: z.string().max(2000).optional().nullable(),
  items: z.array(quotationItemSchema).min(1).optional(),
}).refine(d => Object.keys(d).length > 0, { message: 'Debe proporcionar al menos un campo' })

export const registerApprovalSchema = z.object({
  type: z.enum(APPROVAL_TYPES, { errorMap: () => ({ message: 'Tipo de aprobación inválido' }) }),
  channel: z.enum(APPROVAL_CHANNELS, { errorMap: () => ({ message: 'Canal inválido' }) }),
  approvedByName: z.string().min(2, 'El nombre del aprobador es requerido'),
  notes: z.string().max(1000).optional(),
  rejectionReason: z.string().max(1000).optional(),
  approvedItemIds: z.array(z.string()).optional(),
})

export const convertToSOSchema = z.object({
  advisorId: z.string().optional().nullable(),
  branchId: z.string().optional().nullable(),
  notes: z.string().max(1000).optional(),
})

export type CreateQuotationFormValues = z.infer<typeof createQuotationSchema>
export type UpdateQuotationFormValues = z.infer<typeof updateQuotationSchema>
export type RegisterApprovalFormValues = z.infer<typeof registerApprovalSchema>
export type ConvertToSOFormValues = z.infer<typeof convertToSOSchema>
