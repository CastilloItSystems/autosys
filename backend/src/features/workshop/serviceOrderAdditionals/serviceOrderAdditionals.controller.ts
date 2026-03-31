// backend/src/features/workshop/serviceOrderAdditionals/serviceOrderAdditionals.controller.ts

import type { Request, Response, NextFunction } from 'express'
import prisma from '../../../services/prisma.service.js'
import * as service from './serviceOrderAdditionals.service.js'

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const serviceOrderId =
      (req.params.serviceOrderId as string | undefined) ||
      (typeof req.query.serviceOrderId === 'string' ? req.query.serviceOrderId : undefined)

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
    const id = req.params.id as string
    const result = await service.findById(prisma, id)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.create(prisma, req.body)
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string
    const result = await service.update(prisma, id, req.body)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string
    await service.remove(prisma, id)
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
    const { status } = req.body
    const id = req.params.id as string
    const result = await service.changeStatus(prisma, id, status)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

// ── Additional Items ──────────────────────────────────────────────────────────

export async function getAdditionalItems(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.findAdditionalItems(prisma, req.params.id as string)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function createAdditionalItem(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.createAdditionalItem(prisma, req.params.id as string, req.body)
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
}

export async function updateAdditionalItem(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.updateAdditionalItem(prisma, req.params.itemId as string, req.body)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function deleteAdditionalItem(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteAdditionalItem(prisma, req.params.itemId as string)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}
