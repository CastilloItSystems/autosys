// libs/interfaces/workshop/dashboard.interface.ts

export interface KPIMetric {
  label: string
  value: number | string
  trend?: 'up' | 'down' | null
  color?: string
}

export interface WorkshopDashboardKPIs {
  openServiceOrders: KPIMetric
  todayAppointments: KPIMetric
  vehiclesInReception: KPIMetric
  delayedOrders: KPIMetric
  techniciansAvailable: KPIMetric
  pendingParts: KPIMetric
  readyForDelivery: KPIMetric
}

export type DashboardAlertType = 'delayed' | 'critical' | 'warning' | 'info'

export interface DashboardAlert {
  id: string
  type: DashboardAlertType
  message: string
  relatedTo?: string | null
  relatedId?: string | null
  createdAt: string
}

export type ActivityType =
  | 'appointment'
  | 'reception'
  | 'service_order'
  | 'quality_check'
  | 'delivery'
  | string

export interface RecentActivity {
  id: string
  type: ActivityType
  title: string
  description: string
  timestamp: string
  userId?: string | null
  userName?: string | null
}

export interface QuickStat {
  label: string
  value: number | string
  icon?: string | null
}

export interface WorkshopDashboardData {
  kpis: WorkshopDashboardKPIs
  alerts: DashboardAlert[]
  recentActivity: RecentActivity[]
  quickStats: QuickStat[]
}

export interface WorkshopDashboardSummary {
  startDate: string
  endDate: string
  totalServiceOrders: number
  completedServiceOrders: number
  averageResolutionHours?: number | null
  totalRevenue?: number | null
  [key: string]: unknown
}
