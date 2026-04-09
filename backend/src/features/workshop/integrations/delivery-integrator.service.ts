import type { PrismaClient } from '../../../generated/prisma/client.js'
import { NotFoundError } from '../../../shared/utils/apiError.js'

type PrismaClientType =
  | PrismaClient
  | Omit<
      PrismaClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >

/**
 * Handles VehicleDelivery auto-creation when ServiceOrder transitions to DELIVERED.
 * Similar to Quality Check integration: automatically creates record, allows manual editing after.
 *
 * Auto-creation flow:
 * 1. SO transitions to DELIVERED
 * 2. Check if VehicleDelivery already exists (idempotent)
 * 3. If not, create with default values
 * 4. User can edit attributes (signature, conformity, notes) afterwards
 * 5. SO stays in DELIVERED (no auto-transition to INVOICED)
 */
export async function handleSODeliveryTransition(
  prisma: PrismaClientType,
  serviceOrderId: string,
  proposedStatus: string,
  userId: string,
  empresaId: string
): Promise<void> {
  const db = prisma as PrismaClient

  // Auto-create VehicleDelivery when moving to DELIVERED
  if (proposedStatus === 'DELIVERED') {
    const existingDelivery = await db.vehicleDelivery.findUnique({
      where: { serviceOrderId },
    })

    // Only create if doesn't exist (idempotent)
    if (!existingDelivery) {
      // Verify ServiceOrder still exists
      const so = await db.serviceOrder.findFirst({
        where: { id: serviceOrderId, empresaId },
        select: { id: true },
      })
      if (!so) throw new NotFoundError('Orden de trabajo no encontrada')

      // Auto-create Vehicle Delivery record with sensible defaults
      await db.vehicleDelivery.create({
        data: {
          serviceOrderId,
          deliveredBy: userId, // User who marked as DELIVERED
          empresaId,
          deliveredAt: new Date(), // Current timestamp
          clientConformity: true, // Default approved; user can toggle if needed
        },
      })
    }
  }
}
