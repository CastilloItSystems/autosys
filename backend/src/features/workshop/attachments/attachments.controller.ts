// backend/src/features/workshop/attachments/attachments.controller.ts
import type { Request, Response } from 'express'
import prisma from '../../../services/prisma.service.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { findAttachments, createAttachment, deleteAttachment } from './attachments.service.js'
import type { AttachmentEntityType } from './attachments.service.js'

export const getAll = async (req: Request, res: Response) => {
  const { entityType, entityId } = req.validatedQuery as any
  const data = await findAttachments(prisma, entityType as AttachmentEntityType, entityId, req.empresaId!)
  return ApiResponse.success(res, data)
}

export const create = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string
  const item = await createAttachment(prisma, req.empresaId!, userId, req.body)
  return ApiResponse.created(res, item, 'Adjunto registrado')
}

export const remove = async (req: Request, res: Response) => {
  await deleteAttachment(prisma, req.params.id as string, req.empresaId!)
  return ApiResponse.success(res, null, 'Adjunto eliminado')
}
