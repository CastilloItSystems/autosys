// backend/src/features/crm/dashboard/crm.dashboard.service.ts

import { PrismaClient } from '../../../generated/prisma/client.js'

const now = () => new Date()
const startOfCurrentMonth = () => {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export async function getCrmDashboard(db: unknown, empresaId: string) {
  const prisma = db as PrismaClient
  const monthStart = startOfCurrentMonth()
  const currentNow = now()

  // -----------------------------------------------------------------------
  // Run ALL queries in parallel for performance
  // -----------------------------------------------------------------------
  const [
    // --- LEADS ---
    leadsTotal,
    leadsThisMonth,
    leadsByStatusNew,
    leadsByStatusContacted,
    leadsByStatusQualified,
    leadsByStatusProposal,
    leadsByStatusNegotiation,
    leadsByStatusWon,
    leadsByStatusLost,
    leadsByChannelRepuestos,
    leadsByChannelTaller,
    leadsByChannelVehiculos,
    leadsWonThisMonth,
    leadsLostThisMonth,
    recentLeads,

    // --- QUOTES ---
    quotesTotal,
    quotesActive,
    quotesByStatusDraft,
    quotesByStatusIssued,
    quotesByStatusSent,
    quotesByStatusNegotiating,
    quotesByStatusApproved,
    quotesByStatusRejected,
    quotesByStatusExpired,
    quotesByStatusConverted,
    quotesApprovedThisMonth,
    activeQuotesForPipeline,
    recentQuotes,

    // --- CASES ---
    casesTotal,
    casesOpen,
    casesOverdue,
    casesByPriorityLow,
    casesByPriorityMedium,
    casesByPriorityHigh,
    casesByPriorityCritical,
    casesByStatusOpen,
    casesByStatusInAnalysis,
    casesByStatusInProgress,
    casesByStatusWaitingClient,
    casesByStatusEscalated,
    casesByStatusResolved,
    casesByStatusClosed,
    casesByStatusRejected,
    casesResolvedThisMonth,
    recentCases,

    // --- CUSTOMERS ---
    customersTotal,
    customersActive,
    customersNewThisMonth,
    customersBySegmentProspect,
    customersBySegmentRegular,
    customersBySegmentVip,
    customersBySegmentWholesale,
    customersBySegmentInactive,

    // --- ACTIVITIES ---
    activitiesPending,
    activitiesOverdue,
    activitiesCompletedThisMonth,
    recentOverdueActivities,

    // --- SERVICE ORDERS ---
    serviceOrdersActive,
    serviceOrdersDeliveredThisMonth,
    deliveredSOsThisMonth,
  ] = await Promise.all([
    // === LEADS ===
    prisma.lead.count({ where: { empresaId } }),
    prisma.lead.count({ where: { empresaId, createdAt: { gte: monthStart } } }),
    prisma.lead.count({ where: { empresaId, status: 'NEW' } }),
    prisma.lead.count({ where: { empresaId, status: 'CONTACTED' } }),
    prisma.lead.count({ where: { empresaId, status: 'QUALIFIED' } }),
    prisma.lead.count({ where: { empresaId, status: 'PROPOSAL' } }),
    prisma.lead.count({ where: { empresaId, status: 'NEGOTIATION' } }),
    prisma.lead.count({ where: { empresaId, status: 'WON' } }),
    prisma.lead.count({ where: { empresaId, status: 'LOST' } }),
    prisma.lead.count({ where: { empresaId, channel: 'REPUESTOS' } }),
    prisma.lead.count({ where: { empresaId, channel: 'TALLER' } }),
    prisma.lead.count({ where: { empresaId, channel: 'VEHICULOS' } }),
    prisma.lead.count({ where: { empresaId, status: 'WON', closedAt: { gte: monthStart } } }),
    prisma.lead.count({ where: { empresaId, status: 'LOST', closedAt: { gte: monthStart } } }),
    prisma.lead.findMany({
      where: { empresaId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        channel: true,
        status: true,
        customer: { select: { name: true } },
        createdAt: true,
      },
    }),

    // === QUOTES ===
    prisma.quote.count({ where: { empresaId } }),
    prisma.quote.count({
      where: {
        empresaId,
        status: { notIn: ['REJECTED', 'EXPIRED', 'CONVERTED'] as any },
      },
    }),
    prisma.quote.count({ where: { empresaId, status: 'DRAFT' } }),
    prisma.quote.count({ where: { empresaId, status: 'ISSUED' } }),
    prisma.quote.count({ where: { empresaId, status: 'SENT' } }),
    prisma.quote.count({ where: { empresaId, status: 'NEGOTIATING' } }),
    prisma.quote.count({ where: { empresaId, status: 'APPROVED' } }),
    prisma.quote.count({ where: { empresaId, status: 'REJECTED' } }),
    prisma.quote.count({ where: { empresaId, status: 'EXPIRED' } }),
    prisma.quote.count({ where: { empresaId, status: 'CONVERTED' } }),
    prisma.quote.count({
      where: { empresaId, status: 'APPROVED', createdAt: { gte: monthStart } },
    }),
    prisma.quote.findMany({
      where: {
        empresaId,
        status: { notIn: ['REJECTED', 'EXPIRED', 'CONVERTED'] as any },
      },
      select: { total: true },
    }),
    prisma.quote.findMany({
      where: { empresaId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        quoteNumber: true,
        title: true,
        status: true,
        total: true,
        customer: { select: { name: true } },
        createdAt: true,
      },
    }),

    // === CASES ===
    prisma.case.count({ where: { empresaId } }),
    prisma.case.count({
      where: {
        empresaId,
        status: { notIn: ['CLOSED', 'REJECTED'] as any },
      },
    }),
    prisma.case.count({
      where: {
        empresaId,
        slaDeadline: { lt: currentNow },
        status: { notIn: ['RESOLVED', 'CLOSED', 'REJECTED'] as any },
      },
    }),
    prisma.case.count({ where: { empresaId, priority: 'LOW' } }),
    prisma.case.count({ where: { empresaId, priority: 'MEDIUM' } }),
    prisma.case.count({ where: { empresaId, priority: 'HIGH' } }),
    prisma.case.count({ where: { empresaId, priority: 'CRITICAL' } }),
    prisma.case.count({ where: { empresaId, status: 'OPEN' } }),
    prisma.case.count({ where: { empresaId, status: 'IN_ANALYSIS' } }),
    prisma.case.count({ where: { empresaId, status: 'IN_PROGRESS' } }),
    prisma.case.count({ where: { empresaId, status: 'WAITING_CLIENT' } }),
    prisma.case.count({ where: { empresaId, status: 'ESCALATED' } }),
    prisma.case.count({ where: { empresaId, status: 'RESOLVED' } }),
    prisma.case.count({ where: { empresaId, status: 'CLOSED' } }),
    prisma.case.count({ where: { empresaId, status: 'REJECTED' } }),
    prisma.case.count({
      where: { empresaId, status: 'RESOLVED', resolvedAt: { gte: monthStart } },
    }),
    prisma.case.findMany({
      where: { empresaId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        caseNumber: true,
        title: true,
        priority: true,
        status: true,
        slaDeadline: true,
        customer: { select: { name: true } },
        createdAt: true,
      },
    }),

    // === CUSTOMERS ===
    prisma.customer.count({ where: { empresaId } }),
    prisma.customer.count({ where: { empresaId, isActive: true } }),
    prisma.customer.count({ where: { empresaId, createdAt: { gte: monthStart } } }),
    prisma.customer.count({ where: { empresaId, segment: 'PROSPECT' } }),
    prisma.customer.count({ where: { empresaId, segment: 'REGULAR' } }),
    prisma.customer.count({ where: { empresaId, segment: 'VIP' } }),
    prisma.customer.count({ where: { empresaId, segment: 'WHOLESALE' } }),
    prisma.customer.count({ where: { empresaId, segment: 'INACTIVE' } }),

    // === ACTIVITIES ===
    prisma.activity.count({ where: { empresaId, status: 'PENDING' } }),
    prisma.activity.count({
      where: { empresaId, status: 'PENDING', dueAt: { lt: currentNow } },
    }),
    prisma.activity.count({
      where: { empresaId, status: 'DONE', completedAt: { gte: monthStart } },
    }),
    prisma.activity.findMany({
      where: { empresaId, status: 'PENDING', dueAt: { lt: currentNow } },
      orderBy: { dueAt: 'asc' },
      take: 5,
      select: {
        id: true,
        title: true,
        type: true,
        dueAt: true,
        assignedTo: true,
      },
    }),

    // === SERVICE ORDERS ===
    prisma.serviceOrder.count({
      where: {
        empresaId,
        status: { notIn: ['DELIVERED', 'CANCELLED'] as any },
      },
    }),
    prisma.serviceOrder.count({
      where: {
        empresaId,
        status: 'DELIVERED',
        deliveredAt: { gte: monthStart },
      },
    }),
    prisma.serviceOrder.findMany({
      where: {
        empresaId,
        status: 'DELIVERED',
        deliveredAt: { gte: monthStart },
      },
      select: { total: true },
    }),
  ])

  // -----------------------------------------------------------------------
  // Aggregate computed values
  // -----------------------------------------------------------------------

  // Leads
  const wonPlusLost = leadsWonThisMonth + leadsLostThisMonth
  const conversionRate =
    wonPlusLost > 0 ? (leadsWonThisMonth / wonPlusLost) * 100 : 0

  // Quotes pipeline value
  const pipelineValue = activeQuotesForPipeline.reduce(
    (acc, q) => acc + Number(q.total),
    0
  )

  // Service orders revenue this month
  const totalRevenueThisMonth = deliveredSOsThisMonth.reduce(
    (acc, so) => acc + Number(so.total),
    0
  )

  return {
    leads: {
      total: leadsTotal,
      thisMonth: leadsThisMonth,
      byStatus: {
        NEW: leadsByStatusNew,
        CONTACTED: leadsByStatusContacted,
        QUALIFIED: leadsByStatusQualified,
        PROPOSAL: leadsByStatusProposal,
        NEGOTIATION: leadsByStatusNegotiation,
        WON: leadsByStatusWon,
        LOST: leadsByStatusLost,
      } as Record<string, number>,
      byChannel: {
        REPUESTOS: leadsByChannelRepuestos,
        TALLER: leadsByChannelTaller,
        VEHICULOS: leadsByChannelVehiculos,
      } as Record<string, number>,
      wonThisMonth: leadsWonThisMonth,
      lostThisMonth: leadsLostThisMonth,
      conversionRate: Math.round(conversionRate * 100) / 100,
      recentLeads,
    },
    quotes: {
      total: quotesTotal,
      active: quotesActive,
      pipelineValue,
      byStatus: {
        DRAFT: quotesByStatusDraft,
        ISSUED: quotesByStatusIssued,
        SENT: quotesByStatusSent,
        NEGOTIATING: quotesByStatusNegotiating,
        APPROVED: quotesByStatusApproved,
        REJECTED: quotesByStatusRejected,
        EXPIRED: quotesByStatusExpired,
        CONVERTED: quotesByStatusConverted,
      } as Record<string, number>,
      approvedThisMonth: quotesApprovedThisMonth,
      recentQuotes: recentQuotes.map((q) => ({
        ...q,
        total: Number(q.total),
      })),
    },
    cases: {
      total: casesTotal,
      open: casesOpen,
      overdue: casesOverdue,
      byPriority: {
        LOW: casesByPriorityLow,
        MEDIUM: casesByPriorityMedium,
        HIGH: casesByPriorityHigh,
        CRITICAL: casesByPriorityCritical,
      } as Record<string, number>,
      byStatus: {
        OPEN: casesByStatusOpen,
        IN_ANALYSIS: casesByStatusInAnalysis,
        IN_PROGRESS: casesByStatusInProgress,
        WAITING_CLIENT: casesByStatusWaitingClient,
        ESCALATED: casesByStatusEscalated,
        RESOLVED: casesByStatusResolved,
        CLOSED: casesByStatusClosed,
        REJECTED: casesByStatusRejected,
      } as Record<string, number>,
      resolvedThisMonth: casesResolvedThisMonth,
      recentCases,
    },
    customers: {
      total: customersTotal,
      active: customersActive,
      newThisMonth: customersNewThisMonth,
      bySegment: {
        PROSPECT: customersBySegmentProspect,
        REGULAR: customersBySegmentRegular,
        VIP: customersBySegmentVip,
        WHOLESALE: customersBySegmentWholesale,
        INACTIVE: customersBySegmentInactive,
      } as Record<string, number>,
    },
    activities: {
      pending: activitiesPending,
      overdue: activitiesOverdue,
      completedThisMonth: activitiesCompletedThisMonth,
      recentOverdue: recentOverdueActivities,
    },
    serviceOrders: {
      active: serviceOrdersActive,
      deliveredThisMonth: serviceOrdersDeliveredThisMonth,
      totalRevenueThisMonth,
    },
  }
}
