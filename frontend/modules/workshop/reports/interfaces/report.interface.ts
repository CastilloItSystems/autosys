// libs/interfaces/workshop/report.interface.ts

export interface WorkshopReportFilters {
  startDate?: string
  endDate?: string
}

export interface WorkshopReportBase {
  reportName: string
  generatedAt?: string
  period?: { startDate?: Date; endDate?: Date }
  error?: string
}

export interface ServiceOrdersReport extends WorkshopReportBase {
  statistics?: {
    total: number
    byStatus: Record<string, number>
    totalRevenue: number
  }
  count?: number
}

export interface ProductivityReport extends WorkshopReportBase {
  statistics?: {
    totalTechnicians: number
    totalStandardMinutes: number
    totalRealMinutes: number
    avgEfficiency: number
  }
}

export interface EfficiencyReport extends WorkshopReportBase {
  statistics?: {
    totalOrders: number
    onTime: number
    delayed: number
    onTimeRate: number
  }
}

export interface MaterialsReport extends WorkshopReportBase {
  statistics?: {
    totalMaterials: number
    totalCost: number
    byStatus: Record<string, number>
  }
}

export interface WarrantyReport extends WorkshopReportBase {
  statistics?: {
    totalClaims: number
    byType: Record<string, number>
    totalCost: number
  }
}

export interface FinancialReport extends WorkshopReportBase {
  statistics?: {
    totalRevenue: number
    laborRevenue: number
    partsRevenue: number
    totalOrders: number
    avgOrderValue: number
  }
}

export interface WorkshopReportsAll {
  serviceOrders?: ServiceOrdersReport
  productivity?: ProductivityReport
  efficiency?: EfficiencyReport
  materials?: MaterialsReport
  warranty?: WarrantyReport
  financial?: FinancialReport
}
