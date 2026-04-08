// libs/zods/workshop/totZod.ts
import { z } from 'zod'

export const TOT_STATUSES = ['REQUESTED', 'APPROVED', 'DEPARTED', 'IN_PROGRESS', 'RETURNED', 'INVOICED', 'CANCELLED'] as const
export const TOT_DOCUMENT_TYPES = ['PROVIDER_QUOTE', 'DELIVERY_ACT', 'RETURN_ACT', 'PROVIDER_INVOICE', 'OTHER'] as const

export const createTOTSchema = z.object({
  serviceOrderId: z.string().min(1, 'La orden de servicio es requerida'),
  supplierId: z.string().nullable().optional(),
  providerName: z.string().max(200).nullable().optional(),
  partDescription: z.string().min(1, 'La descripción de la pieza es requerida').max(1000),
  partSerial: z.string().max(100).nullable().optional(),
  photoUrls: z.array(z.string().url()).default([]),
  requestedWork: z.string().min(1, 'El trabajo solicitado es requerido').max(2000),
  technicalInstruction: z.string().max(2000).nullable().optional(),
  estimatedReturnAt: z.string().nullable().optional(),
  providerQuote: z.number().min(0).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
})

export const updateTOTSchema = createTOTSchema.partial().omit({ serviceOrderId: true })

export const addTOTDocumentSchema = z.object({
  type: z.enum(TOT_DOCUMENT_TYPES),
  url: z.string().url('URL inválida'),
  description: z.string().max(500).nullable().optional(),
})

export type CreateTOTFormValues = z.infer<typeof createTOTSchema>
export type UpdateTOTFormValues = z.infer<typeof updateTOTSchema>
