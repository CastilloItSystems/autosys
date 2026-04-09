// backend/src/features/workshop/workshopQuotations/workshopQuotations.controller.ts
import type { Request, Response } from 'express'
import prisma from '../../../services/prisma.service.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import {
  findAllQuotations,
  findQuotationById,
  createQuotation,
  updateQuotation,
  updateQuotationStatus,
  registerApproval,
  convertToServiceOrder,
} from './workshopQuotations.service.js'
import {
  CreateQuotationDTO,
  UpdateQuotationDTO,
  QuotationResponseDTO,
} from './workshopQuotations.dto.js'
import type { QuotationStatus } from './workshopQuotations.interface.js'

export const getAll = async (req: Request, res: Response) => {
  const result = await findAllQuotations(
    prisma,
    req.empresaId!,
    req.validatedQuery as any
  )
  const items = result.data.map((i) => new QuotationResponseDTO(i))
  return ApiResponse.paginated(
    res,
    items,
    result.page,
    result.limit,
    result.total
  )
}

export const getOne = async (req: Request, res: Response) => {
  const item = await findQuotationById(
    prisma,
    req.params.id as string,
    req.empresaId!
  )
  return ApiResponse.success(res, new QuotationResponseDTO(item))
}

export const create = async (req: Request, res: Response) => {
  const userId = req.user?.userId as string
  const item = await createQuotation(
    prisma,
    req.empresaId!,
    userId,
    new CreateQuotationDTO(req.body)
  )
  return ApiResponse.created(
    res,
    new QuotationResponseDTO(item),
    'Cotización creada'
  )
}

export const update = async (req: Request, res: Response) => {
  const item = await updateQuotation(
    prisma,
    req.params.id as string,
    req.empresaId!,
    new UpdateQuotationDTO(req.body)
  )
  return ApiResponse.success(
    res,
    new QuotationResponseDTO(item),
    'Cotización actualizada'
  )
}

export const updateStatus = async (req: Request, res: Response) => {
  const item = await updateQuotationStatus(
    prisma,
    req.params.id as string,
    req.empresaId!,
    req.body.status as QuotationStatus
  )
  return ApiResponse.success(
    res,
    new QuotationResponseDTO(item),
    'Estado de cotización actualizado'
  )
}

export const approve = async (req: Request, res: Response) => {
  const item = await registerApproval(
    prisma,
    req.params.id as string,
    req.empresaId!,
    req.body
  )
  return ApiResponse.success(
    res,
    new QuotationResponseDTO(item),
    'Respuesta del cliente registrada'
  )
}

export const convert = async (req: Request, res: Response) => {
  console.log('DEBUG: Iniciando conversión', {
    id: req.params.id,
    body: req.body,
  }) // Agregar esto
  const userId = req.user?.userId as string
  const item = await convertToServiceOrder(
    prisma,
    req.params.id as string,
    req.empresaId!,
    userId,
    req.body
  )
  return ApiResponse.success(
    res,
    new QuotationResponseDTO(item),
    'Cotización convertida en orden de servicio'
  )
}
