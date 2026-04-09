// backend/src/features/workshop/serviceOrderMaterials/serviceOrderMaterials.controller.ts

import type { Request, Response, NextFunction } from 'express'
import prisma from '../../../services/prisma.service.js'
import * as service from './serviceOrderMaterials.service.js'

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    let serviceOrderId = req.params.serviceOrderId
    if (!serviceOrderId && typeof req.query.serviceOrderId === 'string') {
      serviceOrderId = req.query.serviceOrderId
    }
    if (!serviceOrderId || typeof serviceOrderId !== 'string') {
      return res.status(400).json({ error: 'Service Order ID is required' })
    }

    const getQueryString = (val: any): string | undefined => {
      if (typeof val === 'string') return val
      if (Array.isArray(val)) return val[0] as string
      return undefined
    }

    const filters = {
      status: getQueryString(req.query.status),
      search: getQueryString(req.query.search),
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    }

    const result = await service.findAll(prisma, serviceOrderId, filters)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.findById(prisma, req.params.id as string)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.userId as string | undefined
    const result = await service.create(prisma, req.body, userId)
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.update(
      prisma,
      req.params.id as string,
      req.body
    )
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await service.remove(prisma, req.params.id as string)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}

export async function updateStatus(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { status, warehouseId, quantityReturned } = req.body
    const empresaId = (req as any).empresaId as string | undefined
    const userId = (req as any).user?.userId as string | undefined
    const result = await service.changeStatus(
      prisma,
      req.params.id as string,
      status,
      { warehouseId, quantityReturned, empresaId, userId }
    )
    res.json(result)
  } catch (error) {
    next(error)
  }
}
