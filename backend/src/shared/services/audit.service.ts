/**
 * Audit Service
 * Logs all actions for compliance and debugging
 */

import prisma from '../../services/prisma.service'
import { Request } from 'express'

export interface AuditLogInput {
  entity: string // e.g., "Report", "User", "Inventory"
  entityId: string // ID of the affected record
  action: string // e.g., "EXPORT", "CREATE", "UPDATE", "DELETE"
  userId?: string // User performing action
  changes?: Record<string, any> // { format: 'excel', filters: {...} }
  metadata?: Record<string, any> // { ip, userAgent, duration }
}

/**
 * Create audit log entry
 */
export async function createAuditLog(input: AuditLogInput): Promise<void> {
  try {
    const dataToCreate: any = {
      entity: input.entity,
      entityId: input.entityId,
      action: input.action,
      changes: input.changes || {},
      metadata: input.metadata || {},
    }

    // Only add userId if it exists (otherwise Prisma will complain)
    if (input.userId) {
      dataToCreate.userId = input.userId
    }

    await prisma.auditLog.create({
      data: dataToCreate,
    })
  } catch (error) {
    // Don't throw - audit logging should not break the application
    console.error('Error creating audit log:', error)
  }
}

/**
 * Log report export with user info from request
 */
export async function logReportExport(
  reportType: string,
  format: string,
  req: Request,
  filters?: Record<string, any>
): Promise<void> {
  try {
    // Extract user ID from JWT (assuming decoded in middleware)
    const userId = (req as any).user?.id

    // Extract IP address
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket.remoteAddress ||
      'unknown'

    // Build metadata
    const metadata = {
      ip,
      userAgent: req.get('user-agent') || 'unknown',
      timestamp: new Date().toISOString(),
    }

    // Log the export
    await createAuditLog({
      entity: 'Report',
      entityId: reportType,
      action: 'EXPORT',
      userId,
      changes: {
        format,
        filters: filters || {},
      },
      metadata,
    })
  } catch (error) {
    // Don't throw - audit logging should not break the application
    console.error('Error logging report export:', error)
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
    const where: any = { entity }
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
  } catch (error) {
    console.error('Error fetching audit logs:', error)
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
  } catch (error) {
    console.error('Error fetching user export history:', error)
    throw error
  }
}

export default {
  createAuditLog,
  logReportExport,
  getAuditLogs,
  getUserExportHistory,
}
