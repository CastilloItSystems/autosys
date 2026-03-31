// backend/src/features/workshop/dashboard/workshop-dashboard.service.ts
// FASE 3.4: Workshop Operational Dashboard - Real-time visibility of workshop state

import type { PrismaClient } from '../../../generated/prisma/client.js'

export interface DashboardKPI {
  label: string
  value: number
  trend?: 'up' | 'down' | 'stable'
  color?: 'success' | 'warning' | 'danger' | 'info'
}

export interface DashboardData {
  kpis: {
    openServiceOrders: DashboardKPI
    todayAppointments: DashboardKPI
    vehiclesInReception: DashboardKPI
    delayedOrders: DashboardKPI
    techniciansAvailable: DashboardKPI
    pendingParts: DashboardKPI
    readyForDelivery: DashboardKPI
  }
  alerts: AlertItem[]
  recentActivity: ActivityItem[]
  quickStats: QuickStat[]
}

export interface AlertItem {
  id: string
  type: 'delayed' | 'critical' | 'warning' | 'info'
  message: string
  relatedTo: 'serviceOrder' | 'appointment' | 'vehicle' | 'technician'
  relatedId: string
  createdAt: Date
}

export interface ActivityItem {
  id: string
  type:
    | 'appointment'
    | 'reception'
    | 'service_order'
    | 'quality_check'
    | 'delivery'
  title: string
  description: string
  timestamp: Date
  userId?: string
  userName?: string
}

export interface QuickStat {
  label: string
  value: string | number
  icon?: string
}

/**
 * Get comprehensive dashboard data for workshop operations
 */
export async function getWorkshopDashboard(
  prisma: PrismaClient,
  empresaId: string
): Promise<DashboardData> {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Parallel queries for performance
    const [
      openServiceOrders,
      todayAppointments,
      vehiclesInReception,
      delayedOrders,
      techniciansAvailable,
      pendingParts,
      readyForDelivery,
      alerts,
      recentActivity,
    ] = await Promise.all([
      getOpenServiceOrders(prisma, empresaId),
      getTodayAppointments(prisma, empresaId),
      getVehiclesInReception(prisma, empresaId),
      getDelayedOrders(prisma, empresaId),
      getTechniciansAvailable(prisma, empresaId),
      getPendingParts(prisma, empresaId),
      getReadyForDelivery(prisma, empresaId),
      getDashboardAlerts(prisma, empresaId),
      getRecentActivity(prisma, empresaId),
    ])

    return {
      kpis: {
        openServiceOrders: {
          label: 'OT Abiertas',
          value: openServiceOrders,
          color: 'info',
        },
        todayAppointments: {
          label: 'Citas Hoy',
          value: todayAppointments,
          color: 'info',
        },
        vehiclesInReception: {
          label: 'Vehículos en Recepción',
          value: vehiclesInReception,
          color: 'warning',
        },
        delayedOrders: {
          label: 'OT Retrasadas',
          value: delayedOrders,
          color: delayedOrders > 0 ? 'danger' : 'success',
        },
        techniciansAvailable: {
          label: 'Técnicos Disponibles',
          value: techniciansAvailable,
          color: 'success',
        },
        pendingParts: {
          label: 'Repuestos Pendientes',
          value: pendingParts,
          color: pendingParts > 0 ? 'warning' : 'success',
        },
        readyForDelivery: {
          label: 'Listos para Entrega',
          value: readyForDelivery,
          color: 'success',
        },
      },
      alerts,
      recentActivity,
      quickStats: generateQuickStats(
        openServiceOrders,
        delayedOrders,
        vehiclesInReception,
        techniciansAvailable
      ),
    }
  } catch (error) {
    console.error('Error getting workshop dashboard:', error)
    throw error
  }
}

/**
 * Count open service orders
 */
async function getOpenServiceOrders(
  prisma: PrismaClient,
  empresaId: string
): Promise<number> {
  const count = await prisma.serviceOrder.count({
    where: {
      empresaId,
      status: {
        in: [
          'OPEN',
          'DIAGNOSING',
          'IN_PROGRESS',
          'PAUSED',
          'WAITING_PARTS',
          'WAITING_AUTH',
          'PENDING_APPROVAL',
        ],
      },
    },
  })
  return count
}

/**
 * Count appointments for today
 */
async function getTodayAppointments(
  prisma: PrismaClient,
  empresaId: string
): Promise<number> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const count = await prisma.serviceAppointment.count({
    where: {
      empresaId,
      status: { not: 'CANCELLED' },
      scheduledDate: {
        gte: today,
        lt: tomorrow,
      },
    },
  })
  return count
}

/**
 * Count vehicles currently in reception/in process
 * Based on active ServiceOrders not yet delivered
 */
async function getVehiclesInReception(
  prisma: PrismaClient,
  empresaId: string
): Promise<number> {
  const count = await prisma.serviceOrder.count({
    where: {
      empresaId,
      status: {
        in: [
          'DIAGNOSING',
          'IN_PROGRESS',
          'PAUSED',
          'WAITING_PARTS',
          'QUALITY_CHECK',
          'READY',
        ],
      },
      deliveredAt: null,
    },
  })
  return count
}

/**
 * Count delayed service orders (past estimatedDelivery)
 */
async function getDelayedOrders(
  prisma: PrismaClient,
  empresaId: string
): Promise<number> {
  const now = new Date()
  const count = await prisma.serviceOrder.count({
    where: {
      empresaId,
      status: {
        in: [
          'OPEN',
          'DIAGNOSING',
          'IN_PROGRESS',
          'PAUSED',
          'WAITING_PARTS',
          'WAITING_AUTH',
          'QUALITY_CHECK',
          'READY',
        ],
      },
      estimatedDelivery: { lt: now },
    },
  })
  return count
}

/**
 * Count available technicians (not assigned to active labor times)
 */
async function getTechniciansAvailable(
  prisma: PrismaClient,
  empresaId: string
): Promise<number> {
  // Get all active technicians in this company with technician role
  const activeTechs = await prisma.membership.count({
    where: {
      empresaId,
      role: {
        name: { in: ['technician', 'técnico'] },
      },
    },
  })

  // Get busy technicians (currently have active labor time - no finishedAt)
  const busyTechs = await prisma.laborTime.count({
    where: {
      finishedAt: null,
      status: { in: ['ACTIVE', 'PAUSED'] },
      serviceOrder: {
        empresaId,
      },
    },
  })

  return Math.max(0, activeTechs - busyTechs)
}

/**
 * Count pending parts (parts not yet consumed/dispatched/returned)
 */
async function getPendingParts(
  prisma: PrismaClient,
  empresaId: string
): Promise<number> {
  const count = await prisma.serviceOrderMaterial.count({
    where: {
      empresaId,
      status: { in: ['REQUESTED', 'RESERVED', 'DISPATCHED'] },
    },
  })
  return count
}

/**
 * Count vehicles ready for delivery
 */
async function getReadyForDelivery(
  prisma: PrismaClient,
  empresaId: string
): Promise<number> {
  const count = await prisma.serviceOrder.count({
    where: {
      empresaId,
      status: 'READY',
      deliveredAt: null,
    },
  })
  return count
}

/**
 * Generate dashboard alerts
 */
async function getDashboardAlerts(
  prisma: PrismaClient,
  empresaId: string
): Promise<AlertItem[]> {
  const alerts: AlertItem[] = []
  const now = new Date()

  try {
    // Alert 1: Delayed orders (past estimatedDelivery)
    const delayedOrders = await prisma.serviceOrder.findMany({
      where: {
        empresaId,
        status: {
          in: [
            'OPEN',
            'DIAGNOSING',
            'IN_PROGRESS',
            'PAUSED',
            'WAITING_PARTS',
            'QUALITY_CHECK',
            'READY',
          ],
        },
        estimatedDelivery: { lt: now },
      },
      select: { id: true, folio: true, estimatedDelivery: true },
      take: 3,
    })

    for (const order of delayedOrders) {
      alerts.push({
        id: `delayed-${order.id}`,
        type: 'critical',
        message: `OT ${order.folio} retrasada desde ${order.estimatedDelivery?.toLocaleDateString()}`,
        relatedTo: 'serviceOrder',
        relatedId: order.id,
        createdAt: now,
      })
    }

    // Alert 2: Appointments without reception
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const appointments = await prisma.serviceAppointment.count({
      where: {
        empresaId,
        status: 'CONFIRMED',
        scheduledDate: {
          gte: now,
          lt: tomorrow,
        },
      },
    })

    if (appointments > 5) {
      alerts.push({
        id: 'high-appointments',
        type: 'warning',
        message: `${appointments} citas confirmadas para el día de hoy`,
        relatedTo: 'appointment',
        relatedId: empresaId,
        createdAt: now,
      })
    }

    // Alert 3: Low parts availability
    const lowParts = await prisma.serviceOrderMaterial.count({
      where: {
        empresaId,
        status: { in: ['REQUESTED', 'RESERVED'] },
      },
    })

    if (lowParts > 3) {
      alerts.push({
        id: 'pending-parts',
        type: 'warning',
        message: `${lowParts} repuestos pendientes de instalar`,
        relatedTo: 'serviceOrder',
        relatedId: empresaId,
        createdAt: now,
      })
    }
  } catch (error) {
    console.error('Error generating dashboard alerts:', error)
  }

  return alerts
}

/**
 * Get recent activity for dashboard timeline
 */
async function getRecentActivity(
  prisma: PrismaClient,
  empresaId: string
): Promise<ActivityItem[]> {
  const activities: ActivityItem[] = []
  const last4Hours = new Date(Date.now() - 4 * 60 * 60 * 1000)

  try {
    // Recent vehicle receptions
    const receptions = await prisma.vehicleReception.findMany({
      where: {
        empresaId,
        createdAt: { gte: last4Hours },
      },
      select: { id: true, vehiclePlate: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    for (const reception of receptions) {
      activities.push({
        id: `reception-${reception.id}`,
        type: 'reception',
        title: 'Vehículo Recibido',
        description: `Placa: ${reception.vehiclePlate || 'N/A'}`,
        timestamp: reception.createdAt,
      })
    }

    // Recent service order updates
    const orders = await prisma.serviceOrder.findMany({
      where: {
        empresaId,
        updatedAt: { gte: last4Hours },
      },
      select: { id: true, folio: true, status: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    })

    for (const order of orders) {
      activities.push({
        id: `order-${order.id}`,
        type: 'service_order',
        title: 'OT Actualizada',
        description: `OT ${order.folio} - Estado: ${order.status}`,
        timestamp: order.updatedAt,
      })
    }

    // Sort by timestamp descending
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  } catch (error) {
    console.error('Error getting recent activity:', error)
  }

  return activities.slice(0, 10)
}

/**
 * Generate quick stat summaries
 */
function generateQuickStats(
  openOrders: number,
  delayedOrders: number,
  vehiclesInReception: number,
  techniciansAvailable: number
): QuickStat[] {
  return [
    {
      label: 'Eficiencia',
      value: `${Math.round(((openOrders - delayedOrders) / Math.max(1, openOrders)) * 100)}%`,
      icon: 'activity',
    },
    {
      label: 'Utilización',
      value: `${Math.round((vehiclesInReception / Math.max(1, openOrders)) * 100)}%`,
      icon: 'truck',
    },
    {
      label: 'Capacidad Técnica',
      value: techniciansAvailable > 0 ? 'Alta' : 'Baja',
      icon: 'users',
    },
  ]
}

/**
 * Get dashboard summary for specific date range
 */
export async function getDashboardSummary(
  prisma: PrismaClient,
  empresaId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  completedOrders: number
  totalRevenue: number
  averageCompletionTime: number
  customerSatisfaction: number
}> {
  try {
    const completedOrders = await prisma.serviceOrder.count({
      where: {
        empresaId,
        status: { in: ['DELIVERED', 'INVOICED', 'CLOSED'] },
        deliveredAt: { gte: startDate, lte: endDate },
      },
    })

    // Calculate average completion time (placeholder - adjust based on your model)
    const avgCompletionTime = 8 // hours

    return {
      completedOrders,
      totalRevenue: 0, // Would calculate from related invoices
      averageCompletionTime: avgCompletionTime,
      customerSatisfaction: 85, // Placeholder
    }
  } catch (error) {
    console.error('Error getting dashboard summary:', error)
    return {
      completedOrders: 0,
      totalRevenue: 0,
      averageCompletionTime: 0,
      customerSatisfaction: 0,
    }
  }
}
