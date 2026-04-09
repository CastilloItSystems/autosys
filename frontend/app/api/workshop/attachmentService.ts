// app/api/workshop/attachmentService.ts
import apiClient from '../apiClient'
import type { WorkshopResponse, WorkshopPagedResponse } from '@/libs/interfaces/workshop'

export type AttachmentEntityType =
  | 'SERVICE_ORDER'
  | 'VEHICLE_RECEPTION'
  | 'SERVICE_DIAGNOSIS'
  | 'WORKSHOP_WARRANTY'
  | 'SERVICE_APPOINTMENT'
  | 'QUALITY_CHECK'

export type AttachmentFileType = 'IMAGE' | 'VIDEO' | 'PDF' | 'DOCUMENT' | 'OTHER'

export interface WorkshopAttachment {
  id: string
  entityType: AttachmentEntityType
  entityId: string
  url: string
  name: string
  fileType: AttachmentFileType
  description?: string | null
  mimeType?: string | null
  sizeBytes?: number | null
  createdBy: string
  createdAt: string
}

export interface CreateAttachmentInput {
  entityType: AttachmentEntityType
  entityId: string
  url: string
  name: string
  fileType?: AttachmentFileType
  description?: string
  mimeType?: string
  sizeBytes?: number
}

const BASE = '/workshop/attachments'

const attachmentService = {
  async getAll(entityType: AttachmentEntityType, entityId: string): Promise<WorkshopResponse<WorkshopAttachment[]>> {
    const res = await apiClient.get(BASE, { params: { entityType, entityId } })
    return res.data
  },

  async create(data: CreateAttachmentInput): Promise<WorkshopResponse<WorkshopAttachment>> {
    const res = await apiClient.post(BASE, data)
    return res.data
  },

  async remove(id: string): Promise<WorkshopResponse<null>> {
    const res = await apiClient.delete(`${BASE}/${id}`)
    return res.data
  },
}

export default attachmentService
