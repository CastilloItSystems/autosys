// libs/zods/crm/caseZod.ts

import { z } from 'zod'

export const createCaseSchema = z.object({
  title: z.string().min(1, 'Título requerido'),
  description: z.string().min(1, 'Descripción requerida'),
  type: z.enum([
    'SALE_COMPLAINT',
    'WORKSHOP_COMPLAINT',
    'PARTS_COMPLAINT',
    'WARRANTY',
    'GENERAL_INQUIRY',
    'SUGGESTION',
    'INCIDENT',
    'SERVICE_COMPLAINT',
  ]),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  customerId: z.string().min(1, 'Cliente requerido'),
  customerVehicleId: z.string().optional(),
  leadId: z.string().optional(),
  refDocType: z.string().optional(),
  refDocNumber: z.string().optional(),
  assignedTo: z.string().optional(),
})

export const updateCaseStatusSchema = z.object({
  status: z.enum([
    'OPEN',
    'IN_ANALYSIS',
    'IN_PROGRESS',
    'WAITING_CLIENT',
    'ESCALATED',
    'RESOLVED',
    'CLOSED',
    'REJECTED',
  ]),
  resolution: z.string().optional(),
  rootCause: z.string().optional(),
})

export const addCommentSchema = z.object({
  comment: z.string().min(1, 'El comentario es requerido'),
  isInternal: z.boolean().default(false),
})

export type CreateCaseInput = z.infer<typeof createCaseSchema>
export type UpdateCaseStatusInput = z.infer<typeof updateCaseStatusSchema>
export type AddCommentInput = z.infer<typeof addCommentSchema>
