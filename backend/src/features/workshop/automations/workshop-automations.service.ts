// backend/src/features/workshop/automations/workshop-automations.service.ts
// OPCIÓN C: Workshop Automated Tasks & Alerts

import type { PrismaClient } from '../../../generated/prisma/client.js'

export interface AutomationAlert {
  id: string
  type: 'reminder' | 'warning' | 'critical'
  title: string
  message: string
  recipientEmail?: string
  relatedEntityId: string
  relatedEntityType: 'appointment' | 'serviceOrder' | 'reception' | 'material'
  createdAt: Date
  scheduled?: Date
  sent?: boolean
}

/**
 * Generate alerts for delayed service orders
 * Alert: OT Retrasada
 */
export async function checkDelayedOrders(
  prisma: PrismaClient,
  empresaId: string
) {
  const now = new Date()
  const alerts: AutomationAlert[] = []

  try {
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
        estimatedDelivery: {
          lt: now,
          gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      select: {
        id: true,
        folio: true,
        status: true,
        estimatedDelivery: true,
        assignedAdvisorId: true,
      },
    })

    for (const order of delayedOrders) {
      alerts.push({
        id: `delayed-${order.id}`,
        type: 'critical',
        title: `OT ${order.folio} - RETRASADA`,
        message: `La orden ${order.folio} está ${Math.floor((now.getTime() - (order.estimatedDelivery?.getTime() || 0)) / (1000 * 60 * 60))} horas retrasada`,
        recipientEmail: undefined,
        relatedEntityId: order.id,
        relatedEntityType: 'serviceOrder',
        createdAt: now,
      })
    }
  } catch (error) {
    console.error('Error checking delayed orders:', error)
  }

  return alerts
}

/**
 * Generate alerts for pending material/parts
 * Alert: Repuestos Pendientes Críticos
 */
export async function checkPendingMaterials(
  prisma: PrismaClient,
  empresaId: string
) {
  const alerts: AutomationAlert[] = []

  try {
    const pendingMaterials = await prisma.serviceOrderMaterial.findMany({
      where: {
        empresaId,
        status: { in: ['REQUESTED', 'RESERVED'] },
      },
      include: {
        serviceOrder: {
          select: {
            id: true,
            folio: true,
            status: true,
            assignedAdvisorId: true,
          },
        },
      },
      take: 10,
    })

    // Group by service order
    const groupedByOrder = new Map<string, typeof pendingMaterials>()
    for (const material of pendingMaterials) {
      const orderId = material.serviceOrderId
      if (!groupedByOrder.has(orderId)) groupedByOrder.set(orderId, [])
      groupedByOrder.get(orderId)!.push(material)
    }

    for (const [orderId, materials] of groupedByOrder.entries()) {
      if (materials.length > 0) {
        const order = materials[0].serviceOrder
        alerts.push({
          id: `materials-${orderId}`,
          type: 'warning',
          title: `OT ${order.folio} - ${materials.length} Repuestos Pendientes`,
          message: `Hay ${materials.length} materiales pendientes de despacho para OT ${order.folio}`,
          recipientEmail: undefined,
          relatedEntityId: orderId,
          relatedEntityType: 'serviceOrder',
          createdAt: new Date(),
        })
      }
    }
  } catch (error) {
    console.error('Error checking pending materials:', error)
  }

  return alerts
}

/**
 * Generate alerts for appointments approaching
 * Alert: Recordatorio Cita del Día
 */
export async function checkUpcomingAppointments(
  prisma: PrismaClient,
  empresaId: string
) {
  const now = new Date()
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const alerts: AutomationAlert[] = []

  try {
    const upcomingAppointments = await prisma.serviceAppointment.findMany({
      where: {
        empresaId,
        status: 'CONFIRMED',
        scheduledDate: {
          gte: now,
          lt: in24Hours,
        },
      },
      select: {
        id: true,
        folio: true,
        scheduledDate: true,
      },
    })

    for (const apt of upcomingAppointments) {
      const hoursUntil = Math.floor(
        (apt.scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60)
      )
      alerts.push({
        id: `appointment-${apt.id}`,
        type: 'reminder',
        title: `Recordatorio Cita ${apt.folio}`,
        message: `Su cita es en ${hoursUntil} horas`,
        recipientEmail: undefined,
        relatedEntityId: apt.id,
        relatedEntityType: 'appointment',
        createdAt: now,
      })
    }
  } catch (error) {
    console.error('Error checking upcoming appointments:', error)
  }

  return alerts
}

/**
 * Generate alerts for orders without progress
 * Alert: OT sin Avance en últimas 24h
 */
export async function checkStagnantOrders(
  prisma: PrismaClient,
  empresaId: string
) {
  const now = new Date()
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const alerts: AutomationAlert[] = []

  try {
    const stagnantOrders = await prisma.serviceOrder.findMany({
      where: {
        empresaId,
        status: { in: ['OPEN', 'DIAGNOSING', 'IN_PROGRESS', 'PAUSED'] },
        updatedAt: {
          lte: last24h,
        },
      },
      select: {
        id: true,
        folio: true,
        updatedAt: true,
        assignedTechnicianId: true,
      },
    })

    for (const order of stagnantOrders) {
      const hoursWithoutProgress = Math.floor(
        (now.getTime() - order.updatedAt.getTime()) / (1000 * 60 * 60)
      )
      alerts.push({
        id: `stagnant-${order.id}`,
        type: 'warning',
        title: `OT ${order.folio} - Sin Avance`,
        message: `OT ${order.folio} no ha sido actualizada hace ${hoursWithoutProgress} horas`,
        recipientEmail: undefined,
        relatedEntityId: order.id,
        relatedEntityType: 'serviceOrder',
        createdAt: now,
      })
    }
  } catch (error) {
    console.error('Error checking stagnant orders:', error)
  }

  return alerts
}

/**
 * Generate alerts for vehicles ready for delivery
 * Alert: Vehículos Listos para Entrega
 */
export async function checkReadyForDelivery(
  prisma: PrismaClient,
  empresaId: string
) {
  const alerts: AutomationAlert[] = []

  try {
    const readyOrders = await prisma.serviceOrder.findMany({
      where: {
        empresaId,
        status: 'READY',
        deliveredAt: null,
      },
      select: {
        id: true,
        folio: true,
        assignedAdvisorId: true,
      },
      take: 10,
    })

    for (const order of readyOrders) {
      alerts.push({
        id: `ready-${order.id}`,
        type: 'reminder',
        title: `Vehículo Listo - OT ${order.folio}`,
        message: `El vehículo está listo para entrega. Notificar al cliente.`,
        recipientEmail: undefined,
        relatedEntityId: order.id,
        relatedEntityType: 'serviceOrder',
        createdAt: new Date(),
      })
    }
  } catch (error) {
    console.error('Error checking ready for delivery:', error)
  }

  return alerts
}

/**
 * Generate alerts for pending quality checks
 * Alert: Control de Calidad Pendiente
 */
export async function checkPendingQualityChecks(
  prisma: PrismaClient,
  empresaId: string
) {
  const alerts: AutomationAlert[] = []

  try {
    const ordersNeedingQC = await prisma.serviceOrder.findMany({
      where: {
        empresaId,
        status: 'QUALITY_CHECK',
      },
      select: {
        id: true,
        folio: true,
        serviceTypeId: true,
        assignedAdvisorId: true,
      },
      take: 10,
    })

    for (const order of ordersNeedingQC) {
      alerts.push({
        id: `qc-${order.id}`,
        type: 'warning',
        title: `Control de Calidad Pendiente - OT ${order.folio}`,
        message: `OT ${order.folio} requiere control de calidad`,
        recipientEmail: undefined,
        relatedEntityId: order.id,
        relatedEntityType: 'serviceOrder',
        createdAt: new Date(),
      })
    }
  } catch (error) {
    console.error('Error checking pending QC:', error)
  }

  return alerts
}

/**
 * Execute all automation checks
 * Should be called by a scheduled task (e.g., every 30 minutes)
 */
export async function executeAllAutomationChecks(
  prisma: PrismaClient,
  empresaId: string
) {
  const allAlerts: AutomationAlert[] = []

  try {
    const [delayed, materials, appointments, stagnant, ready, qc] =
      await Promise.all([
        checkDelayedOrders(prisma, empresaId),
        checkPendingMaterials(prisma, empresaId),
        checkUpcomingAppointments(prisma, empresaId),
        checkStagnantOrders(prisma, empresaId),
        checkReadyForDelivery(prisma, empresaId),
        checkPendingQualityChecks(prisma, empresaId),
      ])

    allAlerts.push(
      ...delayed,
      ...materials,
      ...appointments,
      ...stagnant,
      ...ready,
      ...qc
    )

    console.log(
      `✅ Automation checks completed. Generated ${allAlerts.length} alerts.`
    )
    return allAlerts
  } catch (error) {
    console.error('Error executing automation checks:', error)
    return []
  }
}
