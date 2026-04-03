// backend/src/features/workshop/receptions/receptions.controller.ts
import type { Request, Response } from 'express'
import prisma from '../../../services/prisma.service.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import r2StorageService from '../../../services/r2-storage.service.js'
import {
  findAllReceptions,
  findReceptionById,
  createReception,
  updateReception,
  deleteReception,
  changeReceptionStatus,
} from './receptions.service.js'
import {
  CreateReceptionDTO,
  UpdateReceptionDTO,
  ReceptionResponseDTO,
} from './receptions.dto.js'

export const getAll = async (req: Request, res: Response) => {
  const result = await findAllReceptions(
    prisma,
    req.empresaId!,
    req.validatedQuery as any
  )
  const items = result.data.map((i) => new ReceptionResponseDTO(i))
  return ApiResponse.paginated(
    res,
    items,
    result.page,
    result.limit,
    result.total
  )
}

export const getOne = async (req: Request, res: Response) => {
  const item = await findReceptionById(
    prisma,
    req.params.id as string,
    req.empresaId!
  )
  return ApiResponse.success(res, new ReceptionResponseDTO(item))
}

export const create = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId as string
  const item = await createReception(
    prisma,
    req.empresaId!,
    userId,
    new CreateReceptionDTO(req.body)
  )
  return ApiResponse.created(
    res,
    new ReceptionResponseDTO(item),
    'Recepción registrada'
  )
}

export const update = async (req: Request, res: Response) => {
  const item = await updateReception(
    prisma,
    req.params.id as string,
    req.empresaId!,
    new UpdateReceptionDTO(req.body)
  )
  return ApiResponse.success(
    res,
    new ReceptionResponseDTO(item),
    'Recepción actualizada'
  )
}

export const remove = async (req: Request, res: Response) => {
  await deleteReception(prisma, req.params.id as string, req.empresaId!)
  return ApiResponse.success(res, null, 'Recepción eliminada')
}

export const changeStatus = async (req: Request, res: Response) => {
  const item = await changeReceptionStatus(
    prisma,
    req.params.id as string,
    req.empresaId!,
    req.body
  )
  return ApiResponse.success(
    res,
    new ReceptionResponseDTO(item),
    'Estado de recepción actualizado'
  )
}

export const getChecklistResponses = async (req: Request, res: Response) => {
  const { getChecklistResponses: getResponses } =
    await import('./receptions.service.js')
  const responses = await getResponses(
    prisma,
    req.params.id as string,
    req.empresaId!
  )
  return ApiResponse.success(res, responses)
}

export const saveChecklistResponses = async (req: Request, res: Response) => {
  const { saveChecklistResponses: saveResponses } =
    await import('./receptions.service.js')
  // Aceptar array directo o dentro de responses
  const responses = Array.isArray(req.body) ? req.body : req.body.responses
  const result = await saveResponses(
    prisma,
    req.params.id as string,
    req.empresaId!,
    responses
  )
  return ApiResponse.success(
    res,
    result,
    'Respuestas de checklist guardadas',
    201
  )
}

export const uploadSignature = async (req: Request, res: Response) => {
  const id = req.params.id as string
  const { signatureBase64, diagnosticAuthorized } = req.body

  if (!signatureBase64 || typeof signatureBase64 !== 'string') {
    return ApiResponse.error(res, 'Se requiere la firma en base64', 400)
  }

  const reception = await findReceptionById(prisma, id, req.empresaId!)

  // Extraer el buffer del base64 (formato: data:image/png;base64,xxxx)
  const matches = signatureBase64.match(/^data:image\/(\w+);base64,(.+)$/)
  if (!matches) {
    return ApiResponse.error(res, 'Formato de firma inválido', 400)
  }

  const extension = matches[1] // png, jpeg, etc.
  const buffer = Buffer.from(matches[2], 'base64')
  const fileName = `signature-${id}.${extension}`

  // Si ya tiene firma anterior en R2, eliminarla
  if (
    reception.clientSignature &&
    reception.clientSignature.startsWith('http')
  ) {
    await r2StorageService.deleteFile(reception.clientSignature)
  }

  // Subir firma al bucket R2
  const signatureUrl = await r2StorageService.uploadFile(
    buffer,
    fileName,
    `image/${extension}`,
    'workshop/signatures'
  )

  // Actualizar recepción con la URL y autorización
  const updated = await updateReception(prisma, id as string, req.empresaId!, {
    clientSignature: signatureUrl,
    diagnosticAuthorized: diagnosticAuthorized ?? false,
  })

  return ApiResponse.success(
    res,
    { signatureUrl, diagnosticAuthorized: updated.diagnosticAuthorized },
    'Firma guardada correctamente'
  )
}
