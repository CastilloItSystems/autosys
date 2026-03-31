// backend/src/features/workshop/attachments/attachments.service.ts
import type { PrismaClient } from '../../../generated/prisma/client.js'
import { NotFoundError } from '../../../shared/utils/apiError.js'

type Db = PrismaClient | Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

export type AttachmentEntityType =
  | 'SERVICE_ORDER'
  | 'VEHICLE_RECEPTION'
  | 'SERVICE_DIAGNOSIS'
  | 'WORKSHOP_WARRANTY'
  | 'SERVICE_APPOINTMENT'
  | 'QUALITY_CHECK'

export async function findAttachments(
  db: Db,
  entityType: AttachmentEntityType,
  entityId: string,
  empresaId: string
) {
  return (db as PrismaClient).workshopAttachment.findMany({
    where: { entityType, entityId, empresaId },
    orderBy: { createdAt: 'asc' },
  })
}

export async function createAttachment(
  db: Db,
  empresaId: string,
  userId: string,
  data: {
    entityType: AttachmentEntityType
    entityId: string
    url: string
    name: string
    fileType?: string
    description?: string
    mimeType?: string
    sizeBytes?: number
  }
) {
  return (db as PrismaClient).workshopAttachment.create({
    data: {
      entityType: data.entityType,
      entityId: data.entityId,
      url: data.url,
      name: data.name,
      fileType: (data.fileType as any) ?? 'OTHER',
      description: data.description ?? null,
      mimeType: data.mimeType ?? null,
      sizeBytes: data.sizeBytes ?? null,
      uploadedBy: userId,
      empresaId,
    },
  })
}

export async function deleteAttachment(db: Db, id: string, empresaId: string) {
  const existing = await (db as PrismaClient).workshopAttachment.findFirst({ where: { id, empresaId } })
  if (!existing) throw new NotFoundError('Adjunto no encontrado')
  await (db as PrismaClient).workshopAttachment.delete({ where: { id } })
}
