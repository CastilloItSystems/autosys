// backend/src/features/sales/audit/audit.controller.ts

import { Request, Response } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { BadRequestError } from '../../../shared/utils/apiError.js'
import prisma from '../../../services/prisma.service.js'

const ALLOWED_ENTITIES = new Set(['Order', 'PreInvoice', 'Invoice'])

const getHistory = asyncHandler(async (req: Request, res: Response) => {
  const { entity, entityId } = req.query as Record<string, string>
  const limit = Math.min(parseInt((req.query.limit as string) || '50', 10), 100)

  if (!entity || !ALLOWED_ENTITIES.has(entity)) {
    throw new BadRequestError('entity debe ser Order, PreInvoice o Invoice')
  }
  if (!entityId) throw new BadRequestError('entityId es requerido')

  const logs = await prisma.auditLog.findMany({
    where: { entity, entityId, empresaId: req.empresaId },
    include: {
      user: { select: { id: true, nombre: true, correo: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  const data = logs.map((l) => ({
    id: l.id,
    entity: l.entity,
    entityId: l.entityId,
    action: l.action,
    userName: (l.user as any)?.nombre || (l.user as any)?.correo || null,
    userId: l.userId,
    changes: l.changes,
    metadata: l.metadata,
    createdAt: l.createdAt,
  }))

  return ApiResponse.success(res, data)
})

export default { getHistory }
