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
