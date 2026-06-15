// backend/src/features/workshop/postRepairScans/postRepairScans.controller.ts
import type { Request, Response, NextFunction } from 'express'
import prisma from '../../../services/prisma.service.js'
import * as service from './postRepairScans.service.js'

const getEmpresaId = (req: Request) => (req as any).empresaId as string
const getUserId = (req: Request) =>
  ((req as any).user?.userId as string) ?? 'system'

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = {
      serviceOrderId:
        typeof req.query.serviceOrderId === 'string'
          ? req.query.serviceOrderId
          : undefined,
      result:
        typeof req.query.result === 'string' ? req.query.result : undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    }
    const result = await service.list(prisma, getEmpresaId(req), filters)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const sc = await service.getById(
      prisma,
      req.params.id as string,
      getEmpresaId(req)
    )
    res.json(sc)
  } catch (err) {
    next(err)
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const sc = await service.create(
      prisma,
      getEmpresaId(req),
      getUserId(req),
      req.body
    )
    res.status(201).json(sc)
  } catch (err) {
    next(err)
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const sc = await service.update(
      prisma,
      req.params.id as string,
      getEmpresaId(req),
      req.body
    )
    res.json(sc)
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
