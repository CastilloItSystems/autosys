/**
 * Audit Plugin - Prisma Middleware for audit trail tracking
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaMiddlewareParams = any
import { prisma } from '../../../../config/database.js'
import { logger } from '../../../../shared/utils/logger.js'

interface AuditLog {
  id: string
  model: string
  recordId: string
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  changes?: Record<string, { before: any; after: any }>
  changedBy: string
  changedAt: Date
  reason?: string
  ipAddress?: string
}

/**
 * Create audit middleware for Prisma
 */
export function createAuditMiddleware(userId: string) {
  return async (
    params: PrismaMiddlewareParams,
    next: (params: PrismaMiddlewareParams) => Promise<any>
  ) => {
    const before = Date.now()

    try {
      const result = await next(params)

      const after = Date.now()

      // Log action execution
      const action = params.action
      const model = params.model

      if (['create', 'update', 'delete'].includes(action)) {
        try {
          // Create audit log entry (non-blocking)
          logAudit({
            id: `audit-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            model: model || 'Unknown',
            action: action.toUpperCase() as 'CREATE' | 'UPDATE' | 'DELETE',
            recordId: result?.id || params.args?.where?.id || 'unknown',
            changes: extractChanges(params, result),
            changedBy: userId,
            changedAt: new Date(),
          }).catch((err) => {
            logger.error('Failed to create audit log:', err)
          })
        } catch (error) {
          logger.warn(`Audit logging failed for ${model}.${action}:`, error)
        }
      }

      return result
    } catch (error) {
      throw error
    }
  }
}

/**
 * Extract changes from Prisma params
 */
function extractChanges(
  params: PrismaMiddlewareParams,
  result: any
): Record<string, { before: any; after: any }> | undefined {
  const changes: Record<string, { before: any; after: any }> = {}

  if (params.action === 'update' && params.args?.data) {
    Object.keys(params.args.data).forEach((key) => {
      if (result && typeof result === 'object') {
        changes[key] = {
          before: params.args.where ? `(Previous value)` : undefined,
          after: params.args.data[key],
        }
      }
    })
  }

  return Object.keys(changes).length > 0 ? changes : undefined
}

/**
 * Log audit entry (placeholder - integrate with actual audit table)
 */
async function logAudit(log: AuditLog): Promise<void> {
  logger.info(
    `[AUDIT] ${log.action} ${log.model} ID: ${log.recordId} by ${log.changedBy}`
  )
  // In production, this would save to an audit_logs table
  // await prisma.auditLog.create({ data: log });
}

/**
 * Initialize audit tracking for a Prisma client
 */
export function initializeAuditTracking(
  client: typeof prisma,
  userId: string
): void {
  try {
    ;(client as any).$use(createAuditMiddleware(userId))
    logger.info(`Audit tracking initialized for user: ${userId}`)
  } catch (error) {
    logger.error('Failed to initialize audit tracking:', error)
  }
}

/**
 * Get audit log for a record
 */
export async function getAuditLog(
  model: string,
  recordId: string
): Promise<
  Array<{
    id: string
    action: string
    changedAt: Date
    changedBy: string
  }>
> {
  // Placeholder - would query from audit_logs table
  logger.info(`Fetching audit log for ${model} ID: ${recordId}`)
  return []
}

/**
 * Export audit logs
 */
export async function exportAuditLogs(
  startDate: Date,
  endDate: Date,
  model?: string
): Promise<AuditLog[]> {
  // Placeholder - would query from audit_logs table
  logger.info(`Exporting audit logs from ${startDate} to ${endDate}`)
  if (model) {
    logger.info(`  Filtered by model: ${model}`)
  }
  return []
}

export default {
  createAuditMiddleware,
  initializeAuditTracking,
  getAuditLog,
  exportAuditLogs,
}
