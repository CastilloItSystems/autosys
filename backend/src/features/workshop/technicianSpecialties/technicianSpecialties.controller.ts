import type { Request, Response } from 'express'
import prisma from '../../../services/prisma.service.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import * as service from './technicianSpecialties.service.js'
import { WORKSHOP_MESSAGES } from '../shared/constants/messages.js'

export async function getAll(req: Request, res: Response) {
  const filters = {
    isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
    search: req.query.search as string,
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 20,
  }
  const result = await service.findAll(prisma, req.empresaId!, filters)
  const items = result.data
  const meta = PaginationHelper.getMeta(result.page, result.limit, result.total)
  return res.status(200).json({
    success: true,
    message: 'Datos obtenidos exitosamente',
    data: items,
    meta,
    timestamp: new Date().toISOString(),
  })
}

export async function getById(req: Request, res: Response) {
  const item = await service.findById(prisma, req.params.id as string, req.empresaId!)
  return ApiResponse.success(res, item)
}

export async function create(req: Request, res: Response) {
  const result = await service.create(
    prisma,
    req.empresaId!,
    ((req as any).user?.id ?? 'system') as string,
    req.body
  )
  return ApiResponse.created(res, result, WORKSHOP_MESSAGES.technicianSpecialty.created)
}

export async function update(req: Request, res: Response) {
  const result = await service.update(
    prisma,
    req.params.id as string,
    req.empresaId!,
    req.body
  )
  return ApiResponse.success(res, result, WORKSHOP_MESSAGES.technicianSpecialty.updated)
}

export async function remove(req: Request, res: Response) {
  await service.remove(prisma, req.params.id as string, req.empresaId!)
  return ApiResponse.success(res, null, WORKSHOP_MESSAGES.technicianSpecialty.deleted)
}
