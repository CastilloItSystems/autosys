// backend/src/features/workshop/vehicleHistory/vehicleHistory.service.ts
// Historial técnico completo de un vehículo: citas, recepciones, diagnósticos, OTs, garantías.

import type { PrismaClient } from '../../../generated/prisma/client.js'
import { NotFoundError } from '../../../shared/utils/apiError.js'

type Db = PrismaClient | Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

export async function getVehicleHistory(
  db: Db,
  customerVehicleId: string,
  empresaId: string
) {
  // Validar que el vehículo existe y pertenece a la empresa
  const vehicle = await (db as PrismaClient).customerVehicle.findFirst({
    where: { id: customerVehicleId, empresaId },
    select: {
      id: true,
      plate: true,
      year: true,
      color: true,
      mileage: true,
      brand: { select: { name: true } },
      vehicleModel: { select: { name: true } },
      customer: { select: { id: true, name: true, code: true, phone: true } },
    },
  })
  if (!vehicle) throw new NotFoundError('Vehículo no encontrado')

  // Consultar todo en paralelo
  const [appointments, receptions, serviceOrders, warranties] = await Promise.all([
    // Citas
    (db as PrismaClient).serviceAppointment.findMany({
      where: { customerVehicleId, empresaId },
      select: {
        id: true, folio: true, scheduledDate: true, status: true,
        serviceType: { select: { name: true } },
        assignedAdvisorId: true,
        createdAt: true,
      },
      orderBy: { scheduledDate: 'desc' },
    }),

    // Recepciones
    (db as PrismaClient).vehicleReception.findMany({
      where: { customerVehicleId, empresaId },
      select: {
        id: true, folio: true, mileageIn: true, fuelLevel: true, status: true,
        ingressMotive: { select: { name: true } },
        clientDescription: true,
        estimatedDelivery: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),

    // Órdenes de trabajo con items y materiales resumidos
    (db as PrismaClient).serviceOrder.findMany({
      where: { customerVehicleId, empresaId },
      select: {
        id: true, folio: true, status: true, priority: true,
        mileageIn: true, mileageOut: true,
        receivedAt: true, deliveredAt: true, closedAt: true, estimatedDelivery: true,
        serviceType: { select: { name: true } },
        assignedTechnicianId: true, assignedAdvisorId: true,
        laborTotal: true, partsTotal: true, total: true,
        items: {
          select: { type: true, description: true, quantity: true, unitPrice: true, total: true, status: true },
          where: { status: { not: 'CANCELLED' } },
        },
        qualityCheck: { select: { status: true, completedAt: true } },
        delivery: { select: { deliveredAt: true, clientConformity: true } },
      },
      orderBy: { receivedAt: 'desc' },
    }),

    // Garantías
    (db as PrismaClient).workshopWarranty.findMany({
      where: { customerVehicleId, empresaId },
      select: {
        id: true, warrantyNumber: true, type: true, status: true,
        description: true, rootCause: true, resolution: true,
        originalOrder: { select: { id: true, folio: true } },
        expiresAt: true, resolvedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  // Historial de kilometraje extraído de las OTs (cronológico)
  const mileageHistory = serviceOrders
    .filter(so => so.mileageIn != null)
    .map(so => ({ date: so.receivedAt, folio: so.folio, mileageIn: so.mileageIn, mileageOut: so.mileageOut }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return {
    vehicle,
    summary: {
      totalAppointments: appointments.length,
      totalReceptions: receptions.length,
      totalServiceOrders: serviceOrders.length,
      totalWarranties: warranties.length,
      lastVisit: serviceOrders[0]?.receivedAt ?? receptions[0]?.createdAt ?? null,
      lastMileage: mileageHistory[mileageHistory.length - 1]?.mileageIn ?? null,
    },
    mileageHistory,
    appointments,
    receptions,
    serviceOrders,
    warranties,
  }
}
