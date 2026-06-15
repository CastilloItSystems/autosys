// backend/src/features/workshop/roadTests/roadTests.controller.ts
import type { Request, Response, NextFunction } from 'express'
import prisma from '../../../services/prisma.service.js'
import * as service from './roadTests.service.js'

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
      status:
        typeof req.query.status === 'string' ? req.query.status : undefined,
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
    const rt = await service.getById(
      prisma,
      req.params.id as string,
      getEmpresaId(req)
    )
    res.json(rt)
  } catch (err) {
    next(err)
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const rt = await service.create(
      prisma,
      getEmpresaId(req),
      getUserId(req),
      req.body
    )
    res.status(201).json(rt)
  } catch (err) {
    next(err)
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const rt = await service.update(
      prisma,
      req.params.id as string,
      getEmpresaId(req),
      req.body
    )
    res.json(rt)
  } catch (err) {
    next(err)
  }
}

export async function authorize(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const rt = await service.authorize(
      prisma,
      req.params.id as string,
      getEmpresaId(req),
      req.body
    )
    res.json(rt)
  } catch (err) {
    next(err)
  }
}

export async function authorizeClient(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const rt = await service.authorizeClient(
      prisma,
      req.params.id as string,
      getEmpresaId(req),
      req.body
    )
    res.json(rt)
  } catch (err) {
    next(err)
  }
}

export async function depart(req: Request, res: Response, next: NextFunction) {
  try {
    const rt = await service.depart(
      prisma,
      req.params.id as string,
      getEmpresaId(req),
      req.body
    )
    res.json(rt)
  } catch (err) {
    next(err)
  }
}

export async function returnVehicle(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const rt = await service.returnVehicle(
      prisma,
      req.params.id as string,
      getEmpresaId(req),
      req.body
    )
    res.json(rt)
  } catch (err) {
    next(err)
  }
}

export async function cancel(req: Request, res: Response, next: NextFunction) {
  try {
    const rt = await service.cancel(
      prisma,
      req.params.id as string,
      getEmpresaId(req)
    )
    res.json(rt)
  } catch (err) {
    next(err)
  }
}
