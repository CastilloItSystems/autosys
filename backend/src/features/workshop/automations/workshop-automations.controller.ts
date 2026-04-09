// backend/src/features/workshop/automations/workshop-automations.controller.ts
// OPCIÓN C: Automations Controller

import type { Request, Response } from 'express'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { executeAllAutomationChecks } from './workshop-automations.service.js'

/**
 * Execute all automation checks and get alerts
 */
export const getAutomationAlerts = asyncHandler(
  async (req: Request, res: Response) => {
    const empresaId = req.empresaId!
    const prisma =
      (req as any).prisma ||
      require('../../../services/prisma.service.js').default

    const alerts = await executeAllAutomationChecks(prisma, empresaId)

    return ApiResponse.success(res, {
      totalAlerts: alerts.length,
      alerts: alerts.map((a) => ({
        ...a,
        priority: a.type === 'critical' ? 1 : a.type === 'warning' ? 2 : 3,
      })),
    })
  }
)
