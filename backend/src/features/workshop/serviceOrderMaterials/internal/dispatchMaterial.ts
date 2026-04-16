/**
 * Internal helper: Dispatch a ServiceOrderMaterial when its WORKSHOP_SUPPLY exit note is delivered
 * This function avoids circular imports by only importing Prisma, not the full materials service
 */

import { PrismaClient, type Prisma } from '../../../../generated/prisma/client.js'
import { BadRequestError } from '../../../../shared/utils/apiError.js'
import { MovementNumberGenerator } from '../../../inventory/shared/utils/movementNumberGenerator.js'

type DbType = PrismaClient | Prisma.TransactionClient

/**
 * Called by exitNotes.service.deliver() when a WORKSHOP_SUPPLY note transitions to DELIVERED
 * Updates material status to DISPATCHED and records the movement
 */
export async function dispatchMaterialFromExitNote(
  tx: DbType,
  materialId: string,
  userId: string
): Promise<void> {
  // Fetch the material with its relations
  const material = await (tx as PrismaClient).serviceOrderMaterial.findUnique({
    where: { id: materialId },
    include: {
      serviceOrder: { select: { folio: true, empresaId: true } },
      item: { select: { name: true } },
    },
  })

  if (!material) {
    throw new BadRequestError('Material de orden de servicio no encontrado')
  }

  // Guard: must be in RESERVED status
  if (material.status !== 'RESERVED') {
    throw new BadRequestError(
      `No se puede despachar el material: estado actual es ${material.status}`
    )
  }

  // Calculate quantities and totals
  const qty = Number(material.quantityReserved) || Number(material.quantityRequested)
  if (qty <= 0) {
    throw new BadRequestError('La cantidad a despachar debe ser mayor a 0')
  }

  const unitPrice = Number(material.unitPrice || 0)
  const discountPct = Number(material.discountPct || 0)
  const taxRate = Number(material.taxRate || 0.16)

  const subtotal = qty * unitPrice
  const discountAmount = (discountPct / 100) * subtotal
  const baseForTax = subtotal - discountAmount
  const taxAmount = Math.round(baseForTax * taxRate * 100) / 100
  const total = Math.round((baseForTax + taxAmount) * 100) / 100

  // Update material status to DISPATCHED
  await (tx as PrismaClient).serviceOrderMaterial.update({
    where: { id: materialId },
    data: {
      status: 'DISPATCHED',
      quantityDispatched: qty,
      quantity: qty,
      taxAmount,
      total,
    },
  })

  // Record the DISPATCH movement in service order material movement history
  await (tx as PrismaClient).serviceOrderMaterialMovement.create({
    data: {
      materialId,
      type: 'DISPATCH',
      quantity: qty,
      userId,
      notes: 'Despachado automáticamente al entregar nota de salida WORKSHOP_SUPPLY',
      empresaId: material.empresaId,
    },
  })
}
