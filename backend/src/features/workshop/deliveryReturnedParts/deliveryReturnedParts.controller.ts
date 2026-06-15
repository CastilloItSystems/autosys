// backend/src/features/workshop/deliveryReturnedParts/deliveryReturnedParts.controller.ts
import type { Request, Response, NextFunction } from 'express'
import prisma from '../../../services/prisma.service.js'
import * as service from './deliveryReturnedParts.service.js'

const getEmpresaId = (req: Request) => (req as any).empresaId as string

export async function listByDelivery(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await service.listByDelivery(
      prisma,
      req.params.deliveryId as string,
      getEmpresaId(req)
    )
    res.json({ data })
  } catch (err) {
    next(err)
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const part = await service.create(prisma, getEmpresaId(req), req.body)
    res.status(201).json(part)
  } catch (err) {
    next(err)
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const part = await service.update(
      prisma,
      req.params.id as string,
      getEmpresaId(req),
      req.body
    )
    res.json(part)
  } catch (err) {
    next(err)
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await service.remove(prisma, req.params.id as string, getEmpresaId(req))
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
