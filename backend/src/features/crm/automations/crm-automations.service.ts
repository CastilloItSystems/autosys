import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import { logger } from '../../../shared/utils/logger.js'

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

async function createAlertIfMissing(
  prisma: PrismaClient,
  params: {
    empresaId: string
    type: 'STALE_OPPORTUNITY' | 'OVERDUE_ACTIVITY' | 'OVERDUE_CASE' | 'CLOSE_DATE_REMINDER'
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    entityType: string
    entityId: string
    title: string
    message: string
    dedupeKey: string
    metadata?: Record<string, unknown>
  }
): Promise<boolean> {
  try {
    await prisma.crmAutomationAlert.create({
      data: {
        empresaId: params.empresaId,
        type: params.type,
        severity: params.severity,
        entityType: params.entityType,
        entityId: params.entityId,
        title: params.title,
        message: params.message,
        dedupeKey: params.dedupeKey,
        metadata: (params.metadata ?? null) as Prisma.InputJsonValue,
      },
    })
    return true
  } catch {
    return false
  }
}

export async function executeCrmAutomationChecks(prisma: PrismaClient): Promise<Record<string, number>> {
  const now = new Date()
  const staleThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const closeReminderLimit = new Date(now.getTime() + 48 * 60 * 60 * 1000)

  const [staleOpportunities, overdueActivities, overdueCases, closeReminders] = await Promise.all([
    prisma.opportunity.findMany({
      where: {
        status: 'OPEN',
        updatedAt: { lt: staleThreshold },
      },
      select: { id: true, empresaId: true, title: true, ownerId: true, stageCode: true },
      take: 500,
    }),
    prisma.activity.findMany({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        dueAt: { lt: now },
      },
      select: { id: true, empresaId: true, title: true, assignedTo: true, dueAt: true },
      take: 500,
    }),
    prisma.case.findMany({
      where: {
        status: { notIn: ['RESOLVED', 'CLOSED', 'REJECTED'] as any },
        slaDeadline: { lt: now },
      },
      select: { id: true, empresaId: true, caseNumber: true, priority: true, slaDeadline: true },
      take: 500,
    }),
    prisma.opportunity.findMany({
      where: {
        status: 'OPEN',
        expectedCloseAt: { gte: now, lte: closeReminderLimit },
      },
      select: { id: true, empresaId: true, title: true, expectedCloseAt: true, ownerId: true },
      take: 500,
    }),
  ])

  const today = dayKey(now)

  let createdStale = 0
  for (const row of staleOpportunities) {
    const created = await createAlertIfMissing(prisma, {
      empresaId: row.empresaId,
      type: 'STALE_OPPORTUNITY',
      severity: 'HIGH',
      entityType: 'opportunity',
      entityId: row.id,
      title: 'Oportunidad estancada',
      message: `La oportunidad "${row.title}" no tiene movimiento reciente.`,
      dedupeKey: `stale-opportunity:${row.id}:${today}`,
      metadata: { ownerId: row.ownerId, stageCode: row.stageCode },
    })
    if (created) createdStale += 1
  }

  let createdOverdueActivities = 0
  for (const row of overdueActivities) {
    const created = await createAlertIfMissing(prisma, {
      empresaId: row.empresaId,
      type: 'OVERDUE_ACTIVITY',
      severity: 'MEDIUM',
      entityType: 'activity',
      entityId: row.id,
      title: 'Actividad vencida',
      message: `La actividad "${row.title}" está vencida desde ${row.dueAt.toISOString()}.`,
      dedupeKey: `overdue-activity:${row.id}:${today}`,
      metadata: { assignedTo: row.assignedTo },
    })
    if (created) createdOverdueActivities += 1
  }

  let createdOverdueCases = 0
  for (const row of overdueCases) {
    const created = await createAlertIfMissing(prisma, {
      empresaId: row.empresaId,
      type: 'OVERDUE_CASE',
      severity: row.priority === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      entityType: 'case',
      entityId: row.id,
      title: 'Caso con SLA vencido',
      message: `El caso ${row.caseNumber} excedió su SLA.`,
      dedupeKey: `overdue-case:${row.id}:${today}`,
      metadata: { priority: row.priority, slaDeadline: row.slaDeadline },
    })
    if (created) createdOverdueCases += 1
  }

  let createdCloseReminders = 0
  for (const row of closeReminders) {
    const created = await createAlertIfMissing(prisma, {
      empresaId: row.empresaId,
      type: 'CLOSE_DATE_REMINDER',
      severity: 'LOW',
      entityType: 'opportunity',
      entityId: row.id,
      title: 'Recordatorio de cierre',
      message: `La oportunidad "${row.title}" tiene cierre próximo (${row.expectedCloseAt?.toISOString()}).`,
      dedupeKey: `close-reminder:${row.id}:${today}`,
      metadata: { ownerId: row.ownerId },
    })
    if (created) createdCloseReminders += 1
  }

  const summary = {
    staleOpportunities: createdStale,
    overdueActivities: createdOverdueActivities,
    overdueCases: createdOverdueCases,
    closeReminders: createdCloseReminders,
  }

  logger.info('CRM automations executed', summary)
  return summary
}

let intervalRef: NodeJS.Timeout | null = null

export function startCrmAutomationScheduler(prisma: PrismaClient): void {
  if (intervalRef) return

  intervalRef = setInterval(() => {
    executeCrmAutomationChecks(prisma).catch((error) => {
      logger.error('Error running CRM automations', { error: error instanceof Error ? error.message : String(error) })
    })
  }, 15 * 60 * 1000)

  executeCrmAutomationChecks(prisma).catch((error) => {
    logger.error('Error running initial CRM automations', { error: error instanceof Error ? error.message : String(error) })
  })

  logger.info('CRM automation scheduler started (15m interval)')
}
