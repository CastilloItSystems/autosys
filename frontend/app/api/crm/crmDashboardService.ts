import apiClient from "../apiClient"

export interface CrmDashboardData {
  leads: {
    total: number
    thisMonth: number
    byStatus: Record<string, number>
    byChannel: Record<string, number>
    wonThisMonth: number
    lostThisMonth: number
    conversionRate: number
    recentLeads: { id: string; title: string; channel: string; status: string; customer: { name: string } | null; createdAt: string }[]
  }
  opportunities?: {
    total: number
    open: number
    wonThisMonth: number
    lostThisMonth: number
    winRate: number
    pipelineValue: number
    stale: number
    overdueActivities: number
    byChannel: Record<string, number>
    recent: {
      id: string
      title: string
      channel: string
      stageCode: string
      status: string
      amount: number
      ownerId: string
      nextActivityAt: string
      expectedCloseAt: string | null
      createdAt: string
    }[]
  }
  quotes: {
    total: number
    active: number
    pipelineValue: number
    byStatus: Record<string, number>
    approvedThisMonth: number
    recentQuotes: { id: string; quoteNumber: string; title: string; status: string; total: number; customer: { name: string } | null; createdAt: string }[]
  }
  cases: {
    total: number
    open: number
    overdue: number
    byPriority: Record<string, number>
    byStatus: Record<string, number>
    resolvedThisMonth: number
    recentCases: { id: string; caseNumber: string; title: string; priority: string; status: string; slaDeadline: string | null; customer: { name: string } | null; createdAt: string }[]
  }
  customers: {
    total: number
    active: number
    newThisMonth: number
    bySegment: Record<string, number>
  }
  activities: {
    pending: number
    overdue: number
    completedThisMonth: number
    recentOverdue: { id: string; title: string; type: string; dueAt: string; assignedTo: string | null }[]
  }
  alerts?: {
    open: number
    recent: {
      id: string
      type: string
      severity: string
      title: string
      message: string
      createdAt: string
      entityType: string
      entityId: string
    }[]
  }
  serviceOrders: {
    active: number
    deliveredThisMonth: number
    totalRevenueThisMonth: number
  }
}

const crmDashboardService = {
  async get(): Promise<{ data: CrmDashboardData }> {
    const res = await apiClient.get("/crm/dashboard")
    return res.data
  },
}

export default crmDashboardService
