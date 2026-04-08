// backend/src/features/workshop/workshopTOT/workshopTOT.controller.ts
import type { Request, Response } from 'express'
import prisma from '../../../services/prisma.service.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import r2StorageService from '../../../services/r2-storage.service.js'
import { BadRequestError } from '../../../shared/utils/apiError.js'
import {
  findAllTOTs,
  findTOTById,
  createTOT,
  updateTOT,
  updateTOTStatus,
  addDocument,
  removeDocument,
  removeTOT,
} from './workshopTOT.service.js'
import {
  CreateTOTDTO,
  UpdateTOTDTO,
  AddTOTDocumentDTO,
  TOTResponseDTO,
} from './workshopTOT.dto.js'
import type { TOTStatus, ITOTFilters } from './workshopTOT.interface.js'

export const getAll = async (req: Request, res: Response) => {
  const filters = req.validatedQuery as ITOTFilters
  const result = await findAllTOTs(prisma, req.empresaId!, filters)
  const items = result.data.map((i) => new TOTResponseDTO(i))
  return ApiResponse.paginated(
    res,
    items,
    result.page,
    result.limit,
    result.total
  )
}

export const getOne = async (req: Request, res: Response) => {
  const item = await findTOTById(
    prisma,
    req.params.id as string,
    req.empresaId!
  )
  return ApiResponse.success(res, new TOTResponseDTO(item))
}

export const create = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId as string
  const item = await createTOT(
    prisma,
    req.empresaId!,
    userId,
    new CreateTOTDTO(req.body)
  )
  return ApiResponse.created(res, new TOTResponseDTO(item), 'T.O.T. creado')
}

export const update = async (req: Request, res: Response) => {
  const item = await updateTOT(
    prisma,
    req.params.id as string,
    req.empresaId!,
    new UpdateTOTDTO(req.body)
  )
  return ApiResponse.success(
    res,
    new TOTResponseDTO(item),
    'T.O.T. actualizado'
  )
}

export const updateStatus = async (req: Request, res: Response) => {
  const item = await updateTOTStatus(
    prisma,
    req.params.id as string,
    req.empresaId!,
    req.body.status as TOTStatus
  )
  return ApiResponse.success(
    res,
    new TOTResponseDTO(item),
    'Estado T.O.T. actualizado'
  )
}

export const addDoc = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId as string
  const item = await addDocument(
    prisma,
    req.params.id as string,
    req.empresaId!,
    userId,
    new AddTOTDocumentDTO(req.body)
  )
  return ApiResponse.created(
    res,
    new TOTResponseDTO(item),
    'Documento agregado'
  )
}

export const removeDoc = async (req: Request, res: Response) => {
  await removeDocument(
    prisma,
    req.params.id as string,
    req.params.docId as string,
    req.empresaId!
  )
  return ApiResponse.success(res, null, 'Documento eliminado')
}

export const uploadPhoto = async (req: Request, res: Response) => {
  if (!req.file) throw new BadRequestError('No se recibió ningún archivo')
  const key = `workshop/tot/${req.params.id}/${Date.now()}-${req.file.originalname}`
  const url = await r2StorageService.uploadFile(req.file.buffer, key, req.file.mimetype)
  return ApiResponse.success(res, { url }, 'Foto subida exitosamente')
}

export const remove = async (req: Request, res: Response) => {
  await removeTOT(prisma, req.params.id as string, req.empresaId!)
  return ApiResponse.success(res, null, 'T.O.T. eliminado')
}
