import { z } from 'zod'

export const quoteItemSchema = z.object({
  description: z.string().min(1, 'Descripción requerida'),
  quantity: z.number().positive('Debe ser mayor a 0'),
  unitPrice: z.number().min(0),
  discountPct: z.number().min(0).max(100).default(0),
  taxPct: z.number().min(0).max(100).default(0),
  itemId: z.string().optional(),
  notes: z.string().optional(),
})

export const createQuoteSchema = z.object({
  title: z.string().min(1, 'Título requerido'),
  type: z.enum(['VEHICLE', 'PARTS', 'SERVICE', 'CORPORATE']),
  customerId: z.string().min(1, 'Cliente requerido'),
  leadId: z.string().optional(),
  description: z.string().optional(),
  currency: z.string().default('USD'),
  discountPct: z.number().min(0).max(100).default(0),
  taxPct: z.number().min(0).max(100).default(0),
  validUntil: z.string().optional(),
  paymentTerms: z.string().optional(),
  deliveryTerms: z.string().optional(),
  notes: z.string().optional(),
  assignedTo: z.string().optional(),
  items: z.array(quoteItemSchema).default([]),
})

export const updateQuoteStatusSchema = z.object({
  status: z.enum([
    'DRAFT',
    'ISSUED',
    'SENT',
    'NEGOTIATING',
    'APPROVED',
    'REJECTED',
    'EXPIRED',
    'CONVERTED',
  ]),
  notes: z.string().optional(),
})

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>
export type UpdateQuoteStatusInput = z.infer<typeof updateQuoteStatusSchema>
