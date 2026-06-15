// backend/src/features/workshop/materialSignatures/materialSignatures.controller.ts
import type { Request, Response, NextFunction } from 'express'
import prisma from '../../../services/prisma.service.js'
import * as service from './materialSignatures.service.js'

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const empresaId = (req as any).empresaId as string
    const { materialId } = req.params
    const data = await service.listByMaterial(prisma, materialId as string, empresaId)
    res.json({ data })
  } catch (err) {
    next(err)
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const empresaId = (req as any).empresaId as string
    const sig = await service.create(prisma, empresaId, req.body)
    res.status(201).json(sig)
  } catch (err) {
    next(err)
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const empresaId = (req as any).empresaId as string
    await service.remove(prisma, req.params.id as string, empresaId)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

export async function status(req: Request, res: Response, next: NextFunction) {
  try {
    const { materialId } = req.params
    const result = await service.hasCompleteSignatures(prisma, materialId as string)
    res.json(result)
  } catch (err) {
    next(err)
  }
}
