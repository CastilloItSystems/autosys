// backend/src/features/sales/orders/orders.replenishment.ts

import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import { logger } from '../../../shared/utils/logger.js'
import {
  NotFoundError,
  BadRequestError,
} from '../../../shared/utils/apiError.js'
import {
  OrderStatus,
  IOrderSalesWarehouseRef,
  IOrderSalesStockDiagnosis,
  IOrderStockShortage,
  IOrderSuggestedTransfersResult,
  IOrderPurchaseSuggestion,
  IOrderSuggestedPurchaseOrdersResult,
  ICreateOrderReplenishmentInput,
  IOrderSuggestedReplenishmentResult,
  IOrderReplenishmentLineAction,
} from './orders.interface.js'
import transfersService from '../../inventory/transfers/transfers.service.js'
import purchaseOrdersService from '../../inventory/purchaseOrders/purchaseOrders.service.js'
import { OrderNumberGenerator } from '../shared/utils/orderNumberGenerator.js'
import { TaxType as POTaxType } from '../../inventory/purchaseOrders/purchaseOrders.interface.js'
import { createAuditLog } from '../../../services/audit.service.js'
import {
  PrismaClientType,
  MSG,
  ORDER_INCLUDE,
  orderReplenishmentToken,
  salesOrderAuditMetadata,
} from './orders.shared.js'

export async function resolveSalesWarehouse(
  empresaId: string,
  fallbackWarehouseId: string,
  db: PrismaClientType
): Promise<IOrderSalesWarehouseRef> {
  const defaultWarehouse = await (db as PrismaClient).warehouse.findFirst({
    where: { empresaId, isActive: true, isSalesDefault: true },
    select: { id: true, code: true, name: true },
  })

  if (defaultWarehouse) return defaultWarehouse

  const fallbackWarehouse = await (db as PrismaClient).warehouse.findFirst({
    where: { id: fallbackWarehouseId, empresaId, isActive: true },
    select: { id: true, code: true, name: true },
  })

  if (!fallbackWarehouse) {
    throw new BadRequestError(
      'No hay un almacén de venta activo configurado para esta empresa.',
      [
        {
          code: 'SALES_WAREHOUSE_NOT_CONFIGURED',
        } as any,
      ]
    )
  }

  return fallbackWarehouse
}

export async function resolveGenericSupplier(
  empresaId: string,
  db: PrismaClientType,
  createIfMissing: boolean = false
): Promise<{ id: string; code: string; name: string } | null> {
  const existing = await (db as PrismaClient).supplier.findFirst({
    where: { empresaId, isActive: true, isGenericDefault: true },
    select: { id: true, code: true, name: true },
    orderBy: { updatedAt: 'desc' },
  })
  if (existing) return existing

  if (!createIfMissing) return null

  const code = await OrderNumberGenerator.generateSupplierCode(db as PrismaClient, empresaId)

  const created = await (db as PrismaClient).supplier.create({
    data: {
      empresaId,
      code,
      name: 'PROVEEDOR GENERICO',
      notes: 'Proveedor genérico creado automáticamente para sugerencias de compra',
      isActive: true,
      isGenericDefault: true,
    },
    select: { id: true, code: true, name: true },
  })

  return created
}

export function resolvePurchaseSuggestion(
  itemHint:
    | {
        id: string
        lastSupplier: { id: string; code: string; name: string; isActive: boolean } | null
        itemSuppliers: Array<{
          isPreferred: boolean
          lastUnitCost: Prisma.Decimal | null
          supplier: { id: string; code: string; name: string; isActive: boolean }
        }>
      }
    | undefined,
  fallbackGenericSupplier: { id: string; code: string; name: string } | null,
  quantity: number
): IOrderPurchaseSuggestion | null {
  if (itemHint?.lastSupplier?.isActive) {
    return {
      supplierId: itemHint.lastSupplier.id,
      supplierCode: itemHint.lastSupplier.code,
      supplierName: itemHint.lastSupplier.name,
      source: 'LAST_SUPPLIER',
      suggestedQuantity: quantity,
    }
  }

  const preferredHistory = itemHint?.itemSuppliers.find(
    (row) => row.isPreferred && row.supplier.isActive
  )
  if (preferredHistory) {
    return {
      supplierId: preferredHistory.supplier.id,
      supplierCode: preferredHistory.supplier.code,
      supplierName: preferredHistory.supplier.name,
      source: 'PREFERRED_HISTORY',
      lastUnitCost:
        preferredHistory.lastUnitCost !== null
          ? Number(preferredHistory.lastUnitCost)
          : null,
      suggestedQuantity: quantity,
    }
  }

  if (fallbackGenericSupplier) {
    return {
      supplierId: fallbackGenericSupplier.id,
      supplierCode: fallbackGenericSupplier.code,
      supplierName: fallbackGenericSupplier.name,
      source: 'GENERIC_DEFAULT',
      suggestedQuantity: quantity,
    }
  }

  return null
}

export async function buildSalesStockDiagnosis(
  order: Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>,
  empresaId: string,
  db: PrismaClientType
): Promise<IOrderSalesStockDiagnosis> {
  const salesWarehouse = await resolveSalesWarehouse(
    empresaId,
    order.warehouseId,
    db
  )

  const requiredByItem = new Map<
    string,
    { required: number; itemSku: string; itemName: string }
  >()

  for (const row of order.items as any[]) {
    if (!row.itemId) continue

    const prev = requiredByItem.get(row.itemId)
    const qty = Number(row.quantity ?? 0)
    const itemSku = row.item?.sku ?? row.itemId
    const itemName = row.itemName ?? row.item?.name ?? 'Artículo sin nombre'

    if (prev) {
      prev.required += qty
    } else {
      requiredByItem.set(row.itemId, { required: qty, itemSku, itemName })
    }
  }

  const itemIds = [...requiredByItem.keys()]
  if (itemIds.length === 0) {
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      salesWarehouse,
      hasShortages: false,
      shortages: [],
    }
  }

  const [salesWarehouseStocks, originStocks, itemSupplierHints, genericSupplier] = await Promise.all([
    (db as PrismaClient).stock.findMany({
      where: {
        warehouseId: salesWarehouse.id,
        itemId: { in: itemIds },
        item: { empresaId },
      },
      select: {
        itemId: true,
        quantityAvailable: true,
      },
    }),
    (db as PrismaClient).stock.findMany({
      where: {
        itemId: { in: itemIds },
        warehouseId: { not: salesWarehouse.id },
        quantityAvailable: { gt: 0 },
        item: { empresaId },
        warehouse: { empresaId, isActive: true },
      },
      select: {
        itemId: true,
        quantityAvailable: true,
        warehouseId: true,
        warehouse: { select: { id: true, code: true, name: true } },
      },
    }),
    (db as PrismaClient).item.findMany({
      where: { id: { in: itemIds }, empresaId },
      select: {
        id: true,
        lastSupplier: {
          select: { id: true, code: true, name: true, isActive: true },
        },
        itemSuppliers: {
          where: { empresaId },
          orderBy: [{ isPreferred: 'desc' }, { lastPurchasedAt: 'desc' }],
          take: 5,
          select: {
            isPreferred: true,
            lastUnitCost: true,
            supplier: {
              select: { id: true, code: true, name: true, isActive: true },
            },
          },
        },
      },
    }),
    resolveGenericSupplier(empresaId, db),
  ])

  const salesStockMap = new Map(
    salesWarehouseStocks.map((s) => [s.itemId, Number(s.quantityAvailable)])
  )

  const originStocksByItem = new Map<
    string,
    Array<{
      fromWarehouseId: string
      fromWarehouseCode: string
      fromWarehouseName: string
      availableToTransfer: number
    }>
  >()

  for (const stock of originStocks) {
    const list = originStocksByItem.get(stock.itemId) ?? []
    list.push({
      fromWarehouseId: stock.warehouseId,
      fromWarehouseCode: stock.warehouse.code,
      fromWarehouseName: stock.warehouse.name,
      availableToTransfer: Number(stock.quantityAvailable),
    })
    originStocksByItem.set(stock.itemId, list)
  }

  for (const list of originStocksByItem.values()) {
    list.sort((a, b) => b.availableToTransfer - a.availableToTransfer)
  }

  const supplierHintsByItemId = new Map(
    itemSupplierHints.map((item) => [item.id, item])
  )

  const shortages: IOrderStockShortage[] = []

  for (const [itemId, requiredMeta] of requiredByItem.entries()) {
    const available = salesStockMap.get(itemId) ?? 0
    if (available >= requiredMeta.required) continue

    let remaining = requiredMeta.required - available
    const suggestions = []

    for (const origin of originStocksByItem.get(itemId) ?? []) {
      if (remaining <= 0) break
      const suggestedQuantity = Math.min(origin.availableToTransfer, remaining)
      if (suggestedQuantity <= 0) continue

      suggestions.push({
        ...origin,
        suggestedQuantity,
      })
      remaining -= suggestedQuantity
    }

    shortages.push({
      itemId,
      itemSku: requiredMeta.itemSku,
      itemName: requiredMeta.itemName,
      required: requiredMeta.required,
      available,
      shortage: requiredMeta.required - available,
      suggestions,
      purchaseSuggestion:
        remaining > 0
          ? resolvePurchaseSuggestion(
              supplierHintsByItemId.get(itemId),
              genericSupplier,
              remaining
            )
          : null,
      coverage: {
        transferCovered: (requiredMeta.required - available) - remaining,
        purchaseCovered: remaining > 0 ? remaining : 0,
        remaining: 0,
      },
    })
  }

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    salesWarehouse,
    hasShortages: shortages.length > 0,
    shortages,
  }
}

export async function getSalesStockDiagnosis(
  id: string,
  empresaId: string,
  db: PrismaClientType
): Promise<IOrderSalesStockDiagnosis> {
  const order = await (db as PrismaClient).order.findFirst({
    where: { id, empresaId },
    include: ORDER_INCLUDE,
  })

  if (!order) throw new NotFoundError(MSG.notFound)

  return buildSalesStockDiagnosis(order as any, empresaId, db)
}

export async function assertSalesWarehouseStockAvailable(
  id: string,
  empresaId: string,
  db: PrismaClientType
): Promise<IOrderSalesStockDiagnosis> {
  const diagnosis = await getSalesStockDiagnosis(id, empresaId, db)

  if (!diagnosis.hasShortages) return diagnosis

  throw new BadRequestError(
    'No hay stock suficiente en el almacén de venta para aprobar esta orden.',
    [
      {
        code: 'SALES_STOCK_SHORTAGE',
        scope: 'ORDER',
        ...diagnosis,
      } as any,
    ]
  )
}

export async function createSuggestedTransfers(
  id: string,
  empresaId: string,
  userId: string,
  db: PrismaClientType
): Promise<IOrderSuggestedTransfersResult> {
  const order = await (db as PrismaClient).order.findFirst({
    where: { id, empresaId },
    include: ORDER_INCLUDE,
  })
  if (!order) throw new NotFoundError(MSG.notFound)
  if (order.status !== OrderStatus.DRAFT) {
    throw new BadRequestError(
      'Solo se pueden generar transferencias sugeridas para órdenes en borrador.'
    )
  }

  const diagnosis = await buildSalesStockDiagnosis(order as any, empresaId, db)

  if (!diagnosis.hasShortages) {
    throw new BadRequestError(
      'No hay faltantes en el almacén de venta para esta orden.'
    )
  }

  const groupedByOrigin = new Map<
    string,
    {
      fromWarehouseCode: string
      fromWarehouseName: string
      itemsById: Map<string, number>
    }
  >()

  for (const shortage of diagnosis.shortages) {
    for (const suggestion of shortage.suggestions) {
      const current = groupedByOrigin.get(suggestion.fromWarehouseId) ?? {
        fromWarehouseCode: suggestion.fromWarehouseCode,
        fromWarehouseName: suggestion.fromWarehouseName,
        itemsById: new Map<string, number>(),
      }

      current.itemsById.set(
        shortage.itemId,
        (current.itemsById.get(shortage.itemId) ?? 0) + suggestion.suggestedQuantity
      )

      groupedByOrigin.set(suggestion.fromWarehouseId, current)
    }
  }

  if (groupedByOrigin.size === 0) {
    throw new BadRequestError(
      'No hay stock disponible en otros almacenes para sugerir transferencias.',
      [
        {
          code: 'ORDER_TRANSFER_SUGGESTION_EMPTY',
          ...diagnosis,
        } as any,
      ]
    )
  }

  const createdTransfers = await (db as PrismaClient).$transaction(async (tx) => {
    const created = []

    for (const [fromWarehouseId, group] of groupedByOrigin.entries()) {
      const items = [...group.itemsById.entries()].map(([itemId, quantity]) => ({
        itemId,
        quantity,
      }))

      const transfer = await transfersService.create(
        {
          fromWarehouseId,
          toWarehouseId: diagnosis.salesWarehouse.id,
          items,
          notes: `Reabastecimiento sugerido para orden ${order.orderNumber}`,
        },
        userId,
        empresaId,
        tx
      )

      created.push({
        id: transfer.id,
        transferNumber: transfer.transferNumber,
        fromWarehouseId,
        fromWarehouseCode: group.fromWarehouseCode,
        fromWarehouseName: group.fromWarehouseName,
        toWarehouseId: diagnosis.salesWarehouse.id,
        status: String(transfer.status),
        quantity: transfer.quantity,
      })
    }

    return created
  })

  logger.info('Transferencias sugeridas generadas para orden', {
    empresaId,
    orderId: id,
    transferCount: createdTransfers.length,
  })

  await createAuditLog(
    {
      entity: 'Order',
      entityId: id,
      action: 'SUGGEST_TRANSFERS',
      empresaId,
      userId,
      changes: {
        before: { status: order.status },
        after: {
          status: order.status,
          createdTransfersCount: createdTransfers.length,
        },
      },
      metadata: {
        ...salesOrderAuditMetadata(order),
        salesWarehouseId: diagnosis.salesWarehouse.id,
        transferNumbers: createdTransfers.map((row) => row.transferNumber),
      },
    },
    db
  )

  return {
    orderId: id,
    orderNumber: order.orderNumber,
    salesWarehouse: diagnosis.salesWarehouse,
    createdTransfers,
    shortages: diagnosis.shortages,
  }
}

export async function createSuggestedPurchaseOrders(
  id: string,
  empresaId: string,
  userId: string,
  db: PrismaClientType
): Promise<IOrderSuggestedPurchaseOrdersResult> {
  const order = await (db as PrismaClient).order.findFirst({
    where: { id, empresaId },
    include: ORDER_INCLUDE,
  })
  if (!order) throw new NotFoundError(MSG.notFound)
  if (order.status !== OrderStatus.DRAFT) {
    throw new BadRequestError(
      'Solo se pueden generar órdenes de compra sugeridas para órdenes en borrador.'
    )
  }

  const diagnosis = await buildSalesStockDiagnosis(order as any, empresaId, db)

  if (!diagnosis.hasShortages) {
    throw new BadRequestError(
      'No hay faltantes en el almacén de venta para esta orden.'
    )
  }

  const missingPurchaseSuggestion = diagnosis.shortages.some((shortage) => {
    const transferCovered = (shortage.suggestions || []).reduce(
      (sum, s) => sum + Number(s.suggestedQuantity || 0),
      0
    )
    const remainingToPurchase = Math.max(0, shortage.shortage - transferCovered)
    return remainingToPurchase > 0 && !shortage.purchaseSuggestion
  })

  if (missingPurchaseSuggestion) {
    const genericSupplier = await resolveGenericSupplier(
      empresaId,
      db,
      true
    )
    if (genericSupplier) {
      for (const shortage of diagnosis.shortages) {
        const transferCovered = (shortage.suggestions || []).reduce(
          (sum, s) => sum + Number(s.suggestedQuantity || 0),
          0
        )
        const remainingToPurchase = Math.max(0, shortage.shortage - transferCovered)
        if (remainingToPurchase <= 0 || shortage.purchaseSuggestion)
          continue
        shortage.purchaseSuggestion = {
          supplierId: genericSupplier.id,
          supplierCode: genericSupplier.code,
          supplierName: genericSupplier.name,
          source: 'GENERIC_DEFAULT',
          suggestedQuantity: remainingToPurchase,
        }
      }
    }
  }

  const shortagesForPurchase = diagnosis.shortages.filter((shortage) => {
    const transferCovered = (shortage.suggestions || []).reduce(
      (sum, s) => sum + Number(s.suggestedQuantity || 0),
      0
    )
    const remainingToPurchase = Math.max(0, shortage.shortage - transferCovered)
    return remainingToPurchase > 0 && Boolean(shortage.purchaseSuggestion?.supplierId)
  })

  if (shortagesForPurchase.length === 0) {
    throw new BadRequestError(
      'No hay faltantes sin origen transferible para sugerir órdenes de compra.',
      [
        {
          code: 'ORDER_PURCHASE_SUGGESTION_EMPTY',
          ...diagnosis,
        } as any,
      ]
    )
  }

  const groupedBySupplier = new Map<
    string,
    {
      supplierCode: string
      supplierName: string
      itemsById: Map<
        string,
        { itemName: string; quantity: number; unitCost: number | null }
      >
    }
  >()

  for (const shortage of shortagesForPurchase) {
    const supplier = shortage.purchaseSuggestion!
    const transferCovered = (shortage.suggestions || []).reduce(
      (sum, s) => sum + Number(s.suggestedQuantity || 0),
      0
    )
    const remainingToPurchase = Math.max(0, shortage.shortage - transferCovered)
    if (remainingToPurchase <= 0) continue

    const current = groupedBySupplier.get(supplier.supplierId) ?? {
      supplierCode: supplier.supplierCode,
      supplierName: supplier.supplierName,
      itemsById: new Map<
        string,
        { itemName: string; quantity: number; unitCost: number | null }
      >(),
    }

    const existing = current.itemsById.get(shortage.itemId)
    if (existing) {
      existing.quantity += remainingToPurchase
    } else {
      current.itemsById.set(shortage.itemId, {
        itemName: shortage.itemName,
        quantity: remainingToPurchase,
        unitCost: supplier.lastUnitCost ?? null,
      })
    }

    groupedBySupplier.set(supplier.supplierId, current)
  }

  const result = await (db as PrismaClient).$transaction(async (tx) => {
    const created: IOrderSuggestedPurchaseOrdersResult['created'] = []
    const reused: IOrderSuggestedPurchaseOrdersResult['reused'] = []
    const lineMerges: IOrderSuggestedPurchaseOrdersResult['lineMerges'] = []

    for (const [supplierId, group] of groupedBySupplier.entries()) {
      const existingDraft = await tx.purchaseOrder.findFirst({
        where: {
          supplierId,
          warehouseId: diagnosis.salesWarehouse.id,
          status: 'DRAFT',
          currency: order.currency as any,
          warehouse: { empresaId },
        },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      })

      if (existingDraft) {
        const mergedByItemId = new Map<
          string,
          {
            itemId: string
            itemName?: string
            quantityOrdered: number
            unitCost: number
            discountPercent: number
            taxType: POTaxType
          }
        >()

        for (const line of existingDraft.items) {
          mergedByItemId.set(line.itemId, {
            itemId: line.itemId,
            itemName: line.itemName ?? undefined,
            quantityOrdered: line.quantityOrdered,
            unitCost: Number(line.unitCost),
            discountPercent: Number(line.discountPercent),
            taxType: line.taxType as POTaxType,
          })
        }

        for (const [itemId, itemData] of group.itemsById.entries()) {
          const currentLine = mergedByItemId.get(itemId)
          if (currentLine) {
            currentLine.quantityOrdered += itemData.quantity
            lineMerges.push({
              purchaseOrderId: existingDraft.id,
              itemId,
              quantityAdded: itemData.quantity,
              merged: true,
            })
            continue
          }

          mergedByItemId.set(itemId, {
            itemId,
            itemName: itemData.itemName,
            quantityOrdered: itemData.quantity,
            unitCost: itemData.unitCost ?? 0,
            discountPercent: 0,
            taxType: POTaxType.IVA,
          })
          lineMerges.push({
            purchaseOrderId: existingDraft.id,
            itemId,
            quantityAdded: itemData.quantity,
            merged: false,
          })
        }

        await purchaseOrdersService.update(
          existingDraft.id,
          {
            items: [...mergedByItemId.values()],
          },
          empresaId,
          tx
        )

        reused.push({
          purchaseOrderId: existingDraft.id,
          orderNumber: existingDraft.orderNumber,
          supplierId,
          supplierCode: group.supplierCode,
          supplierName: group.supplierName,
        })
        continue
      }

      const createdPO = await purchaseOrdersService.createWithItems(
        {
          supplierId,
          warehouseId: diagnosis.salesWarehouse.id,
          currency: order.currency as any,
          notes: `Reabastecimiento sugerido para orden ${order.orderNumber}`,
          items: [...group.itemsById.entries()].map(([itemId, itemData]) => ({
            itemId,
            itemName: itemData.itemName,
            quantityOrdered: itemData.quantity,
            unitCost: itemData.unitCost ?? 0,
            discountPercent: 0,
            taxType: POTaxType.IVA,
          })),
        },
        empresaId,
        userId,
        tx
      )

      created.push({
        purchaseOrderId: createdPO.id,
        orderNumber: createdPO.orderNumber,
        supplierId,
        supplierCode: group.supplierCode,
        supplierName: group.supplierName,
      })

      for (const [itemId, itemData] of group.itemsById.entries()) {
        lineMerges.push({
          purchaseOrderId: createdPO.id,
          itemId,
          quantityAdded: itemData.quantity,
          merged: false,
        })
      }
    }

    return { created, reused, lineMerges }
  })

  logger.info('Órdenes de compra sugeridas generadas para orden', {
    empresaId,
    orderId: id,
    created: result.created.length,
    reused: result.reused.length,
  })

  await createAuditLog(
    {
      entity: 'Order',
      entityId: id,
      action: 'SUGGEST_PURCHASE_ORDERS',
      empresaId,
      userId,
      changes: {
        before: { status: order.status },
        after: {
          status: order.status,
          createdPurchaseOrdersCount: result.created.length,
          reusedPurchaseOrdersCount: result.reused.length,
        },
      },
      metadata: {
        ...salesOrderAuditMetadata(order),
        salesWarehouseId: diagnosis.salesWarehouse.id,
        purchaseOrderNumbers: [
          ...result.created.map((row) => row.orderNumber),
          ...result.reused.map((row) => row.orderNumber),
        ],
      },
    },
    db
  )

  return {
    orderId: id,
    orderNumber: order.orderNumber,
    salesWarehouse: diagnosis.salesWarehouse,
    created: result.created,
    reused: result.reused,
    lineMerges: result.lineMerges,
    shortages: diagnosis.shortages,
  }
}

export async function createSuggestedReplenishmentPlan(
  id: string,
  empresaId: string,
  userId: string,
  input: ICreateOrderReplenishmentInput,
  db: PrismaClientType
): Promise<IOrderSuggestedReplenishmentResult> {
  const order = await (db as PrismaClient).order.findFirst({
    where: { id, empresaId },
    include: ORDER_INCLUDE,
  })
  if (!order) throw new NotFoundError(MSG.notFound)
  if (order.status !== OrderStatus.DRAFT) {
    throw new BadRequestError(
      'Solo se puede resolver reabastecimiento para órdenes en borrador.'
    )
  }

  const diagnosis = await buildSalesStockDiagnosis(order as any, empresaId, db)
  if (!diagnosis.hasShortages) {
    throw new BadRequestError('No hay faltantes en el almacén de venta para esta orden.')
  }

  const token = orderReplenishmentToken(order.id)
  const overrideMap = new Map(
    (input.overrides ?? []).map((o) => [o.itemId, o])
  )

  // Ensure we have a fallback generic supplier for uncovered purchase lines
  const needsGeneric = diagnosis.shortages.some((shortage) => {
    const transferCovered = (shortage.suggestions ?? []).reduce(
      (sum, row) => sum + Number(row.suggestedQuantity || 0),
      0
    )
    return (
      Math.max(0, shortage.shortage - transferCovered) > 0 &&
      !shortage.purchaseSuggestion
    )
  })
  const genericSupplier = needsGeneric
    ? await resolveGenericSupplier(empresaId, db, true)
    : null

  const manualSupplierIds = new Set<string>()
  for (const override of overrideMap.values()) {
    if (override?.supplierId) manualSupplierIds.add(override.supplierId)
  }
  const manualSuppliers = manualSupplierIds.size
    ? await (db as PrismaClient).supplier.findMany({
        where: {
          id: { in: [...manualSupplierIds] },
          empresaId,
          isActive: true,
        },
        select: { id: true, code: true, name: true },
      })
    : []
  const manualSupplierById = new Map(manualSuppliers.map((s) => [s.id, s]))

  const groupedTransfers = new Map<
    string,
    {
      fromWarehouseCode: string
      fromWarehouseName: string
      itemsById: Map<string, number>
    }
  >()
  const groupedPurchases = new Map<
    string,
    {
      supplierCode: string
      supplierName: string
      itemsById: Map<string, { itemName: string; quantity: number; unitCost: number | null }>
    }
  >()

  const shortagesWithPlan: IOrderSuggestedReplenishmentResult['shortages'] = []

  for (const shortage of diagnosis.shortages) {
    const transferPlan = shortage.suggestions ?? []
    const transferCovered = transferPlan.reduce(
      (sum, s) => sum + Number(s.suggestedQuantity || 0),
      0
    )
    const baseRemaining = Math.max(0, shortage.shortage - transferCovered)
    const override = overrideMap.get(shortage.itemId)

    let purchaseQuantity = baseRemaining
    if (override?.purchaseQuantity !== undefined) {
      purchaseQuantity = Math.max(0, Math.min(baseRemaining, Number(override.purchaseQuantity)))
    }

    let supplierChoice:
      | { id: string; code: string; name: string }
      | null = null

    if (override?.supplierId) {
      supplierChoice = manualSupplierById.get(override.supplierId) ?? null
      if (!supplierChoice) {
        throw new BadRequestError(
          `Proveedor inválido o inactivo para item ${shortage.itemSku}`
        )
      }
    } else if (shortage.purchaseSuggestion) {
      supplierChoice = {
        id: shortage.purchaseSuggestion.supplierId,
        code: shortage.purchaseSuggestion.supplierCode,
        name: shortage.purchaseSuggestion.supplierName,
      }
    } else if (genericSupplier) {
      supplierChoice = genericSupplier
    }

    const purchasePlan =
      purchaseQuantity > 0 && supplierChoice
        ? [
            {
              supplierId: supplierChoice.id,
              supplierCode: supplierChoice.code,
              supplierName: supplierChoice.name,
              quantity: purchaseQuantity,
            },
          ]
        : []

    const purchaseCovered = purchasePlan.reduce((sum, row) => sum + row.quantity, 0)
    const remainingAfterPlan = Math.max(0, baseRemaining - purchaseCovered)

    shortage.coverage = {
      transferCovered,
      purchaseCovered,
      remaining: remainingAfterPlan,
    }

    shortagesWithPlan.push({
      ...shortage,
      transferPlan,
      purchasePlan,
      remainingAfterPlan,
    })

    for (const suggestion of transferPlan) {
      if (!suggestion.suggestedQuantity) continue
      const transferGroup = groupedTransfers.get(suggestion.fromWarehouseId) ?? {
        fromWarehouseCode: suggestion.fromWarehouseCode,
        fromWarehouseName: suggestion.fromWarehouseName,
        itemsById: new Map<string, number>(),
      }
      transferGroup.itemsById.set(
        shortage.itemId,
        (transferGroup.itemsById.get(shortage.itemId) ?? 0) + suggestion.suggestedQuantity
      )
      groupedTransfers.set(suggestion.fromWarehouseId, transferGroup)
    }

    for (const plan of purchasePlan) {
      const purchaseGroup = groupedPurchases.get(plan.supplierId) ?? {
        supplierCode: plan.supplierCode,
        supplierName: plan.supplierName,
        itemsById: new Map<
          string,
          { itemName: string; quantity: number; unitCost: number | null }
        >(),
      }
      const existing = purchaseGroup.itemsById.get(shortage.itemId)
      if (existing) existing.quantity += plan.quantity
      else {
        purchaseGroup.itemsById.set(shortage.itemId, {
          itemName: shortage.itemName,
          quantity: plan.quantity,
          unitCost: shortage.purchaseSuggestion?.lastUnitCost ?? null,
        })
      }
      groupedPurchases.set(plan.supplierId, purchaseGroup)
    }
  }

  const lineActions: IOrderReplenishmentLineAction[] = []

  const execution = await (db as PrismaClient).$transaction(async (tx) => {
    const createdTransfers: IOrderSuggestedReplenishmentResult['createdTransfers'] = []
    const reusedTransfers: IOrderSuggestedReplenishmentResult['reusedTransfers'] = []
    const createdPOs: IOrderSuggestedReplenishmentResult['createdPOs'] = []
    const reusedPOs: IOrderSuggestedReplenishmentResult['reusedPOs'] = []

    for (const [fromWarehouseId, group] of groupedTransfers.entries()) {
      const existingDraft = await tx.transfer.findFirst({
        where: {
          fromWarehouseId,
          toWarehouseId: diagnosis.salesWarehouse.id,
          status: 'DRAFT',
          code: token,
          fromWarehouse: { empresaId },
        },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      })

      if (existingDraft) {
        let quantityDelta = 0
        for (const [itemId, quantity] of group.itemsById.entries()) {
          const existingItem = existingDraft.items.find((i) => i.itemId === itemId)
          if (existingItem) {
            await tx.transferItem.update({
              where: { id: existingItem.id },
              data: { quantity: { increment: quantity } },
            })
            lineActions.push({
              actionType: 'TRANSFER',
              targetType: 'MERGED',
              targetId: existingDraft.id,
              itemId,
              quantity,
            })
          } else {
            await tx.transferItem.create({
              data: {
                transferId: existingDraft.id,
                itemId,
                quantity,
              },
            })
            lineActions.push({
              actionType: 'TRANSFER',
              targetType: 'MERGED',
              targetId: existingDraft.id,
              itemId,
              quantity,
            })
          }
          quantityDelta += quantity
        }

        await tx.transfer.update({
          where: { id: existingDraft.id },
          data: {
            quantity: { increment: quantityDelta },
          },
        })

        reusedTransfers.push({
          id: existingDraft.id,
          transferNumber: existingDraft.transferNumber,
          fromWarehouseId,
          fromWarehouseCode: group.fromWarehouseCode,
          fromWarehouseName: group.fromWarehouseName,
          toWarehouseId: diagnosis.salesWarehouse.id,
          status: String(existingDraft.status),
          quantity: existingDraft.quantity + quantityDelta,
        })
        continue
      }

      const createdTransfer = await transfersService.create(
        {
          fromWarehouseId,
          toWarehouseId: diagnosis.salesWarehouse.id,
          items: [...group.itemsById.entries()].map(([itemId, quantity]) => ({
            itemId,
            quantity,
          })),
          notes: `${token} Reabastecimiento sugerido para orden ${order.orderNumber}`,
        },
        userId,
        empresaId,
        tx
      )

      await tx.transfer.update({
        where: { id: createdTransfer.id },
        data: { code: token },
      })

      createdTransfers.push({
        id: createdTransfer.id,
        transferNumber: createdTransfer.transferNumber,
        fromWarehouseId,
        fromWarehouseCode: group.fromWarehouseCode,
        fromWarehouseName: group.fromWarehouseName,
        toWarehouseId: diagnosis.salesWarehouse.id,
        status: String(createdTransfer.status),
        quantity: createdTransfer.quantity,
      })

      for (const [itemId, quantity] of group.itemsById.entries()) {
        lineActions.push({
          actionType: 'TRANSFER',
          targetType: 'CREATED',
          targetId: createdTransfer.id,
          itemId,
          quantity,
        })
      }
    }

    for (const [supplierId, group] of groupedPurchases.entries()) {
      const existingDraft = await tx.purchaseOrder.findFirst({
        where: {
          supplierId,
          warehouseId: diagnosis.salesWarehouse.id,
          status: 'DRAFT',
          currency: order.currency as any,
          warehouse: { empresaId },
          notes: { contains: token, mode: 'insensitive' },
        },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      })

      if (existingDraft) {
        const mergedByItemId = new Map<
          string,
          {
            itemId: string
            itemName?: string
            quantityOrdered: number
            unitCost: number
            discountPercent: number
            taxType: POTaxType
          }
        >()
        for (const line of existingDraft.items) {
          mergedByItemId.set(line.itemId, {
            itemId: line.itemId,
            itemName: line.itemName ?? undefined,
            quantityOrdered: line.quantityOrdered,
            unitCost: Number(line.unitCost),
            discountPercent: Number(line.discountPercent),
            taxType: line.taxType as POTaxType,
          })
        }

        for (const [itemId, itemData] of group.itemsById.entries()) {
          const current = mergedByItemId.get(itemId)
          if (current) {
            current.quantityOrdered += itemData.quantity
            lineActions.push({
              actionType: 'PURCHASE',
              targetType: 'MERGED',
              targetId: existingDraft.id,
              itemId,
              quantity: itemData.quantity,
            })
          } else {
            mergedByItemId.set(itemId, {
              itemId,
              itemName: itemData.itemName,
              quantityOrdered: itemData.quantity,
              unitCost: itemData.unitCost ?? 0,
              discountPercent: 0,
              taxType: POTaxType.IVA,
            })
            lineActions.push({
              actionType: 'PURCHASE',
              targetType: 'MERGED',
              targetId: existingDraft.id,
              itemId,
              quantity: itemData.quantity,
            })
          }
        }

        await purchaseOrdersService.update(
          existingDraft.id,
          { items: [...mergedByItemId.values()] },
          empresaId,
          tx
        )

        reusedPOs.push({
          purchaseOrderId: existingDraft.id,
          orderNumber: existingDraft.orderNumber,
          supplierId,
          supplierCode: group.supplierCode,
          supplierName: group.supplierName,
          status: String(existingDraft.status),
        })
        continue
      }

      const createdPO = await purchaseOrdersService.createWithItems(
        {
          supplierId,
          warehouseId: diagnosis.salesWarehouse.id,
          currency: order.currency as any,
          notes: `${token} Reabastecimiento sugerido para orden ${order.orderNumber}`,
          items: [...group.itemsById.entries()].map(([itemId, itemData]) => ({
            itemId,
            itemName: itemData.itemName,
            quantityOrdered: itemData.quantity,
            unitCost: itemData.unitCost ?? 0,
            discountPercent: 0,
            taxType: POTaxType.IVA,
          })),
        },
        empresaId,
        userId,
        tx
      )

      createdPOs.push({
        purchaseOrderId: createdPO.id,
        orderNumber: createdPO.orderNumber,
        supplierId,
        supplierCode: group.supplierCode,
        supplierName: group.supplierName,
        status: String(createdPO.status),
      })

      for (const [itemId, itemData] of group.itemsById.entries()) {
        lineActions.push({
          actionType: 'PURCHASE',
          targetType: 'CREATED',
          targetId: createdPO.id,
          itemId,
          quantity: itemData.quantity,
        })
      }
    }

    const linkedTransfersRaw = await tx.transfer.findMany({
      where: {
        code: token,
        fromWarehouse: { empresaId },
      },
      select: { id: true, transferNumber: true, status: true },
      orderBy: { createdAt: 'desc' },
    })
    const linkedPOsRaw = await tx.purchaseOrder.findMany({
      where: {
        notes: { contains: token, mode: 'insensitive' },
        warehouse: { empresaId },
      },
      select: { id: true, orderNumber: true, status: true },
      orderBy: { createdAt: 'desc' },
    })

    return {
      createdTransfers,
      reusedTransfers,
      createdPOs,
      reusedPOs,
      linkedTransfersRaw,
      linkedPOsRaw,
    }
  })

  const response = {
    orderId: order.id,
    orderNumber: order.orderNumber,
    salesWarehouse: diagnosis.salesWarehouse,
    shortages: shortagesWithPlan,
    createdTransfers: execution.createdTransfers,
    reusedTransfers: execution.reusedTransfers,
    createdPOs: execution.createdPOs,
    reusedPOs: execution.reusedPOs,
    lineActions,
    executionState: {
      linkedTransfers: execution.linkedTransfersRaw.map((row) => ({
        id: row.id,
        transferNumber: row.transferNumber,
        status: String(row.status),
      })),
      linkedPOs: execution.linkedPOsRaw.map((row) => ({
        id: row.id,
        orderNumber: row.orderNumber,
        status: String(row.status),
      })),
      pendingTransfersCount: execution.linkedTransfersRaw.filter((row) =>
        !['RECEIVED', 'CANCELLED', 'REJECTED'].includes(String(row.status))
      ).length,
      pendingPOsCount: execution.linkedPOsRaw.filter((row) =>
        !['COMPLETED', 'CANCELLED'].includes(String(row.status))
      ).length,
    },
  }

  await createAuditLog(
    {
      entity: 'Order',
      entityId: order.id,
      action: 'SUGGEST_REPLENISHMENT',
      empresaId,
      userId,
      changes: {
        before: { status: order.status },
        after: {
          status: order.status,
          createdTransfersCount: response.createdTransfers.length,
          reusedTransfersCount: response.reusedTransfers.length,
          createdPurchaseOrdersCount: response.createdPOs.length,
          reusedPurchaseOrdersCount: response.reusedPOs.length,
        },
      },
      metadata: {
        ...salesOrderAuditMetadata(order),
        salesWarehouseId: diagnosis.salesWarehouse.id,
        lineActions,
        linkedTransfers: response.executionState.linkedTransfers,
        linkedPOs: response.executionState.linkedPOs,
      },
    },
    db
  )

  return response
}
