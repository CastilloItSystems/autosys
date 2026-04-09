import type { PrismaClient } from '../../../generated/prisma/client.js'
import { BadRequestError } from '../../../shared/utils/apiError.js'

type PrismaClientType =
  | PrismaClient
  | Omit<
      PrismaClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >

/**
 * Handles business logic and validations for Quality Check integration
 * within the Service Order workflow.
 */
export async function handleSOQualityCheckTransition(
  prisma: PrismaClientType,
  serviceOrderId: string,
  proposedStatus: string,
  userId: string
): Promise<void> {
  const db = prisma as PrismaClient

  // 1. If moving to QUALITY_CHECK, ensure a record exists
  if (proposedStatus === 'QUALITY_CHECK') {
    const existingQC = await db.qualityCheck.findUnique({
      where: { serviceOrderId },
    })

    if (!existingQC) {
      // Auto-create Quality Check record if it doesn't exist
      await db.qualityCheck.create({
        data: {
          serviceOrderId,
          inspectorId: userId, // Default to the person who triggered the transition
          status: 'PENDING',
          createdBy: userId,
        },
      })
    }
  }

  // 2. If moving to READY or DELIVERED, ensure Quality Check is PASSED
  if (['READY', 'DELIVERED'].includes(proposedStatus)) {
    const qc = await db.qualityCheck.findUnique({
      where: { serviceOrderId },
      select: { status: true },
    })

    if (!qc) {
      throw new BadRequestError(
        'No se puede marcar la orden como lista o entregada sin realizar el control de calidad.'
      )
    }

    if (qc.status !== 'PASSED') {
      throw new BadRequestError(
        'La orden no ha sido aprobada en el control de calidad. El estado actual del control es: ' +
          qc.status
      )
    }
  }
}
