/**
 * Workshop Billing Sync Service
 * FASE 2.8: Synchronize operational items (Materials, Additionals, TOTs) to master billing list (ServiceOrderItem)
 *
 * Ensures that when a technical event occurs (material dispatched, additional approved, etc.),
 * those items are injected into the ServiceOrderItem table for facturación purposes.
 *
 * The sync process:
 * 1. Reads ServiceOrderMaterial with status >= DISPATCHED
 * 2. Reads ServiceOrderAdditionalItem with approved parent
 * 3. Reads WorkshopTOT with status >= RETURNED
 * 4. Creates/Updates ServiceOrderItem with sourceType + sourceRefId
 * 5. Recalculates ServiceOrder totals
 */

import type {
  PrismaClient,
  ServiceOrder,
  ServiceOrderItem,
} from '../../../generated/prisma/client.js'
import {
  BadRequestError,
  NotFoundError,
} from '../../../shared/utils/apiError.js'

type PrismaClientType =
  | PrismaClient
  | Omit<
      PrismaClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >

/**
 * Calculate tax amount for a line item
 * Formula: (quantity * unitPrice - discount) * taxRate
 *
 * @param quantity
 * @param unitPrice
 * @param discountPct - percentage (0-100)
 * @param taxRate - rate (0.16 for 16%)
 * @returns taxAmount
 */
function calculateTaxAmount(
  quantity: number,
  unitPrice: number,
  discountPct: number,
  taxRate: number
): number {
  const subtotal = quantity * unitPrice
  const discountAmount = (discountPct / 100) * subtotal
  const baseForTax = subtotal - discountAmount
  return Math.round(baseForTax * taxRate * 100) / 100
}

/**
 * Main sync function: reconcile all operational items to master billing list
 *
 * @param prisma - Prisma client
 * @param serviceOrderId - ID of the ServiceOrder
 * @returns Updated ServiceOrder with refreshed totals
 */
export async function syncServiceOrderItems(
  prisma: PrismaClientType,
  serviceOrderId: string
): Promise<ServiceOrder> {
  // 1. Fetch the ServiceOrder
  const so = await prisma.serviceOrder.findUnique({
    where: { id: serviceOrderId },
    include: {
      items: true,
      materials: { include: { item: true } },
      additionals: { include: { additionalItems: true } },
      tots: true,
    },
  })

  if (!so) {
    throw new NotFoundError(`ServiceOrder ${serviceOrderId} not found`)
  }

  // 2. Get manual items (sourceType: MANUAL) to preserve them
  const manualItems = so.items.filter((i) => i.sourceType === 'MANUAL')

  // 3. Load operational items to sync
  const syncedItems: ServiceOrderItem[] = []

  // 3A. Materials (DISPATCHED or higher status)
  const dispatchedMaterials = so.materials.filter(
    (m) =>
      m.status === 'DISPATCHED' ||
      m.status === 'CONSUMED' ||
      m.status === 'RETURNED'
  )

  for (const material of dispatchedMaterials) {
    const taxAmount = calculateTaxAmount(
      Number(material.quantityDispatched),
      Number(material.unitPrice),
      Number(material.discountPct || 0),
      Number(material.taxRate)
    )

    const subtotal =
      Number(material.quantityDispatched) * Number(material.unitPrice) -
      (Number(material.discountPct || 0) / 100) *
        Number(material.quantityDispatched) *
        Number(material.unitPrice)

    const totalLine = subtotal + taxAmount

    // Upsert: update if exists by sourceRefId, create if not
    const existingItem = so.items.find(
      (i) => i.sourceRefId === material.id && i.sourceType === 'MATERIAL'
    )

    if (existingItem) {
      // Update existing
      await (prisma as PrismaClient).serviceOrderItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: Number(material.quantityDispatched),
          unitPrice: Number(material.unitPrice),
          discountPct: Number(material.discountPct || 0),
          taxType: material.taxType,
          taxRate: Number(material.taxRate),
          taxAmount,
          total: totalLine,
          unitCost: Number(material.unitCost),
          itemId: material.itemId || undefined,
          description: material.description,
        },
      })
      syncedItems.push(existingItem)
    } else {
      // Create new
      const newItem = await (prisma as PrismaClient).serviceOrderItem.create({
        data: {
          serviceOrderId,
          type: 'PART',
          status: 'PENDING',
          description: material.description,
          itemName: material.item?.name || material.description,
          quantity: Number(material.quantityDispatched),
          unitPrice: Number(material.unitPrice),
          discountPct: Number(material.discountPct || 0),
          taxType: material.taxType,
          taxRate: Number(material.taxRate),
          taxAmount,
          total: totalLine,
          unitCost: Number(material.unitCost),
          sourceType: 'MATERIAL',
          sourceRefId: material.id,
          itemId: material.itemId || undefined,
        },
      })
      syncedItems.push(newItem)
    }
  }

  // 3B. Additional Items (from APPROVED additionals only)
  const approvedAdditionals = so.additionals.filter(
    (a) => a.status === 'APPROVED' || a.status === 'EXECUTED'
  )

  for (const additional of approvedAdditionals) {
    for (const addItem of additional.additionalItems) {
      if (addItem.clientApproved !== true) continue // Skip if not approved

      const taxAmount = calculateTaxAmount(
        Number(addItem.quantity),
        Number(addItem.unitPrice),
        Number(addItem.discountPct || 0),
        Number(addItem.taxRate)
      )

      const subtotal =
        Number(addItem.quantity) * Number(addItem.unitPrice) -
        (Number(addItem.discountPct || 0) / 100) *
          Number(addItem.quantity) *
          Number(addItem.unitPrice)

      const totalLine = subtotal + taxAmount

      const existingItem = so.items.find(
        (i) => i.sourceRefId === addItem.id && i.sourceType === 'ADDITIONAL'
      )

      if (existingItem) {
        // Update
        await (prisma as PrismaClient).serviceOrderItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: Number(addItem.quantity),
            unitPrice: Number(addItem.unitPrice),
            discountPct: Number(addItem.discountPct || 0),
            taxType: addItem.taxType,
            taxRate: Number(addItem.taxRate),
            taxAmount,
            total: totalLine,
            unitCost: Number(addItem.unitCost),
            description: addItem.description,
          },
        })
        syncedItems.push(existingItem)
      } else {
        // Create
        const newItem = await (prisma as PrismaClient).serviceOrderItem.create({
          data: {
            serviceOrderId,
            type: addItem.type === 'LABOR' ? 'LABOR' : 'PART',
            status: 'PENDING',
            description: addItem.description,
            quantity: Number(addItem.quantity),
            unitPrice: Number(addItem.unitPrice),
            discountPct: Number(addItem.discountPct || 0),
            taxType: addItem.taxType,
            taxRate: Number(addItem.taxRate),
            taxAmount,
            total: totalLine,
            unitCost: Number(addItem.unitCost),
            sourceType: 'ADDITIONAL',
            sourceRefId: addItem.id,
          },
        })
        syncedItems.push(newItem)
      }
    }
  }

  // 3C. WorkshopTOT (RETURNED or INVOICED status)
  const returningTOTs = so.tots.filter(
    (t) => t.status === 'RETURNED' || t.status === 'INVOICED'
  )

  for (const tot of returningTOTs) {
    // Only sync if clientPrice is set
    if (!tot.clientPrice) continue

    const taxAmount = calculateTaxAmount(
      1,
      Number(tot.clientPrice),
      Number(tot.discountPct || 0),
      Number(tot.taxRate)
    )

    const subtotal =
      Number(tot.clientPrice) -
      (Number(tot.discountPct || 0) / 100) * Number(tot.clientPrice)

    const totalLine = subtotal + taxAmount

    const existingItem = so.items.find(
      (i) => i.sourceRefId === tot.id && i.sourceType === 'TOT'
    )

    if (existingItem) {
      // Update
      await (prisma as PrismaClient).serviceOrderItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: 1,
          unitPrice: Number(tot.clientPrice),
          discountPct: Number(tot.discountPct || 0),
          taxType: tot.taxType,
          taxRate: Number(tot.taxRate),
          taxAmount,
          total: totalLine,
          unitCost: Number(tot.finalCost || 0),
          description: tot.partDescription,
        },
      })
      syncedItems.push(existingItem)
    } else {
      // Create
      const newItem = await (prisma as PrismaClient).serviceOrderItem.create({
        data: {
          serviceOrderId,
          type: 'OTHER',
          status: 'PENDING',
          description: tot.partDescription,
          itemName: tot.partDescription,
          quantity: 1,
          unitPrice: Number(tot.clientPrice),
          discountPct: Number(tot.discountPct || 0),
          taxType: tot.taxType,
          taxRate: Number(tot.taxRate),
          taxAmount,
          total: totalLine,
          unitCost: Number(tot.finalCost || 0),
          sourceType: 'TOT',
          sourceRefId: tot.id,
        },
      })
      syncedItems.push(newItem)
    }
  }

  // 4. Remove stale items (synced items that are no longer in operational tables and weren't manual)
  const allSyncedItemIds = syncedItems.map((i) => i.id)
  const staleItems = so.items.filter(
    (i) => i.sourceType !== 'MANUAL' && !allSyncedItemIds.includes(i.id)
  )

  for (const staleItem of staleItems) {
    await (prisma as PrismaClient).serviceOrderItem.delete({
      where: { id: staleItem.id },
    })
  }

  // 5. Recalculate ServiceOrder totals
  const allItems = [...manualItems, ...syncedItems]

  let laborTotal = 0
  let partsTotal = 0
  let otherTotal = 0
  let subtotal = 0
  let totalTaxAmount = 0
  let totalDiscount = 0

  for (const item of allItems) {
    const lineSubtotal =
      Number(item.quantity) * Number(item.unitPrice) -
      (Number(item.discountPct) / 100) *
        Number(item.quantity) *
        Number(item.unitPrice)
    const lineTax = Number(item.taxAmount)
    const lineTotal = lineSubtotal + lineTax

    if (item.type === 'LABOR') {
      laborTotal += lineTotal
    } else if (item.type === 'PART') {
      partsTotal += lineTotal
    } else {
      otherTotal += lineTotal
    }

    subtotal += lineSubtotal
    totalTaxAmount += lineTax
    totalDiscount +=
      (Number(item.discountPct) / 100) *
      Number(item.quantity) *
      Number(item.unitPrice)
  }

  const finalTotal = laborTotal + partsTotal + otherTotal

  // 6. Update ServiceOrder totals
  const updatedSO = await (prisma as PrismaClient).serviceOrder.update({
    where: { id: serviceOrderId },
    data: {
      laborTotal,
      partsTotal,
      otherTotal,
      subtotal,
      discount: totalDiscount,
      taxAmt: totalTaxAmount,
      total: finalTotal,
      updatedAt: new Date(),
    },
    include: { items: true },
  })

  return updatedSO
}

/**
 * Trigger sync after a material status change
 * Call this after DISPATCHED or RETURNED
 */
export async function syncAfterMaterialChange(
  prisma: PrismaClientType,
  materialId: string
): Promise<void> {
  const material = await (
    prisma as PrismaClient
  ).serviceOrderMaterial.findUnique({
    where: { id: materialId },
  })

  if (!material) {
    throw new NotFoundError(`Material ${materialId} not found`)
  }

  await syncServiceOrderItems(prisma, material.serviceOrderId)
}

/**
 * Trigger sync after an additional status change
 * Call this after APPROVED
 */
export async function syncAfterAdditionalChange(
  prisma: PrismaClientType,
  additionalId: string
): Promise<void> {
  const additional = await (
    prisma as PrismaClient
  ).serviceOrderAdditional.findUnique({
    where: { id: additionalId },
  })

  if (!additional) {
    throw new NotFoundError(`Additional ${additionalId} not found`)
  }

  await syncServiceOrderItems(prisma, additional.serviceOrderId)
}

/**
 * Trigger sync after a TOT status change
 * Call this after RETURNED
 */
export async function syncAfterTOTChange(
  prisma: PrismaClientType,
  totId: string
): Promise<void> {
  const tot = await (prisma as PrismaClient).workshopTOT.findUnique({
    where: { id: totId },
  })

  if (!tot) {
    throw new NotFoundError(`TOT ${totId} not found`)
  }

  await syncServiceOrderItems(prisma, tot.serviceOrderId)
}
