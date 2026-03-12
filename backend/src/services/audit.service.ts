/**
 * Audit Service
 * Logs all actions for compliance and debugging
 */

import { Request } from 'express'
import prisma from './prisma.service.js'
import { logger } from '../shared/utils/logger.js'

export interface AuditLogInput {
  entity: string // e.g., "Report", "User", "Inventory"
  entityId: string // ID of the affected record
  action: string // e.g., "EXPORT", "CREATE", "UPDATE", "DELETE"
  userId?: string // User performing action
  changes?: Record<string, unknown> // { format: 'excel', filters: {...} }
  metadata?: Record<string, unknown> // { ip, userAgent, duration }
}

/**
 * Create audit log entry
 */
export async function createAuditLog(input: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        entity: input.entity,
        entityId: input.entityId,
        action: input.action,
        changes: (input.changes ?? {}) as any,
        ...(input.metadata !== undefined
          ? { metadata: input.metadata as any }
          : {}),
        ...(input.userId ? { userId: input.userId } : {}),
      },
    })
  } catch (error: unknown) {
    logger.error('Error creating audit log', {
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

/**
 * Log report export with user info from request
 */
export async function logReportExport(
  reportType: string,
  format: string,
  req: Request,
  filters?: Record<string, unknown>
): Promise<void> {
  try {
    const userId = req.user?.userId
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown'

    await createAuditLog({
      entity: 'Report',
      entityId: reportType,
      action: 'EXPORT',
      userId,
      changes: { format, filters: filters || {} },
      metadata: {
        ip,
        userAgent: req.get('user-agent') || 'unknown',
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error: unknown) {
    logger.error('Error logging report export', {
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

/**
 * Get audit logs for a specific entity
 */
export async function getAuditLogs(
  entity: string,
  entityId?: string,
  limit: number = 50
) {
  try {
    const where: {
      entity: string
      entityId?: string
    } = { entity }
    if (entityId) {
      where.entityId = entityId
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            correo: true,
            nombre: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return logs
  } catch (error: unknown) {
    logger.error('Error fetching audit logs', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

/**
 * Get export history for a user
 */
export async function getUserExportHistory(userId: string, limit: number = 20) {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        entity: 'Report',
        action: 'EXPORT',
        userId,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return logs
  } catch (error: unknown) {
    logger.error('Error fetching user export history', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

export default {
  createAuditLog,
  logReportExport,
  getAuditLogs,
  getUserExportHistory,
}
