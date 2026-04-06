// backend/src/features/workshop/receptionMedia/receptionMedia.controller.ts
import type { Request, Response } from 'express'
import prisma from '../../../services/prisma.service.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import r2StorageService from '../../../services/r2-storage.service.js'
import * as svc from './receptionMedia.service.js'
import { BadRequestError } from '../../../shared/utils/apiError.js'

// ── Upload ──
export const uploadMedia = async (req: Request, res: Response) => {
  if (!req.file) {
    throw new BadRequestError('No se recibió ningún archivo')
  }

  const receptionId = req.params.receptionId
  const fileName = `${Date.now()}-${req.file.originalname}`
  const key = `workshop/receptions/${receptionId}/${fileName}`

  const url = await r2StorageService.uploadFile(
    req.file.buffer,
    key,
    req.file.mimetype
  )

  return ApiResponse.success(res, { url }, 'Archivo subido exitosamente')
}

// ── Daños ──
export const getDamages = async (req: Request, res: Response) => {
  const data = await svc.findDamages(prisma, req.params.receptionId as string, req.empresaId!)
  return ApiResponse.success(res, data)
}

export const addDamage = async (req: Request, res: Response) => {
  const item = await svc.createDamage(prisma, req.params.receptionId as string, req.empresaId!, req.body)
  return ApiResponse.created(res, item, 'Daño registrado')
}

export const editDamage = async (req: Request, res: Response) => {
  const item = await svc.updateDamage(prisma, req.params.damageId as string, req.empresaId!, req.body)
  return ApiResponse.success(res, item, 'Daño actualizado')
}

export const removeDamage = async (req: Request, res: Response) => {
  await svc.deleteDamage(prisma, req.params.damageId as string, req.empresaId!)
  return ApiResponse.success(res, null, 'Daño eliminado')
}

// ── Fotos ──
export const getPhotos = async (req: Request, res: Response) => {
  const data = await svc.findPhotos(prisma, req.params.receptionId as string, req.empresaId!)
  return ApiResponse.success(res, data)
}

export const addPhoto = async (req: Request, res: Response) => {
  const item = await svc.createPhoto(prisma, req.params.receptionId as string, req.empresaId!, req.body)
  return ApiResponse.created(res, item, 'Foto registrada')
}

export const removePhoto = async (req: Request, res: Response) => {
  await svc.deletePhoto(prisma, req.params.photoId as string, req.empresaId!)
  return ApiResponse.success(res, null, 'Foto eliminada')
}
