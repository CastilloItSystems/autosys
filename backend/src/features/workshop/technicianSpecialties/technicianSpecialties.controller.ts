import type { Request, Response, NextFunction } from 'express'
import prisma from '../../../services/prisma.service.js'
import * as service from './technicianSpecialties.service.js'

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const { empresaId } = req.user as any
    const filters = {
      isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
      search: req.query.search as string,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    }
    const result = await service.findAll(prisma, empresaId, filters)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string
    const result = await service.findById(
      prisma,
      id,
      (req.user as any).empresaId
    )
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.create(
      prisma,
      (req.user as any).empresaId,
      (req.user as any).id,
      req.body
    )
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string
    const result = await service.update(
      prisma,
      id,
      (req.user as any).empresaId,
      req.body
    )
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string
    await service.remove(prisma, id, (req.user as any).empresaId)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}
