// backend/src/features/sales/orders/orders.service.ts

import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import { logger } from '../../../shared/utils/logger.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import {
  NotFoundError,
  BadRequestError,
} from '../../../shared/utils/apiError.js'
import { domainEventBus } from '../../../shared/events/domain-event-bus.js'
import { toDomainEvent } from '../../../shared/events/domain-events.js'
import { SALES_MESSAGES } from '../shared/constants/messages.js'
import { CreateOrderDTO, UpdateOrderDTO } from './orders.dto.js'
import {
  IOrder,
  OrderStatus,
  OrderCurrency,
  IOrderFilters,
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
import { calculateOrderTotals } from '../../inventory/shared/utils/calculateOrderTotals.js'
import transfersService from '../../inventory/transfers/transfers.service.js'
import purchaseOrdersService from '../../inventory/purchaseOrders/purchaseOrders.service.js'
import { OrderNumberGenerator } from '../shared/utils/orderNumberGenerator.js'
import { TaxType as POTaxType } from '../../inventory/purchaseOrders/purchaseOrders.interface.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

const MSG = SALES_MESSAGES?.order ?? {
  notFound: 'Orden no encontrada',
  cannotEdit: 'No se puede editar esta orden',
  created: 'Orden creada exitosamente',
  updated: 'Orden actualizada exitosamente',
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ORDER_INCLUDE = {
  items: {
    include: {
      item: { select: { id: true, sku: true, name: true, salePrice: true } },
    },
  },
  customer: true,
  warehouse: { select: { id: true, name: true, code: true, empresaId: true } },
} as const

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateOrderNumber(): string {
  const year = new Date().getFullYear()
  const ts = Date.now().toString(36).toUpperCase()
  const rnd = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `OV-${year}-${ts}${rnd}`
}

function generatePreInvoiceNumber(): string {
  const year = new Date().getFullYear()
  const ts = Date.now().toString(36).toUpperCase()
  const rnd = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `PF-${year}-${ts}${rnd}`
}

function orderReplenishmentToken(orderId: string): string {
  return `[ORDER:${orderId}]`
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class OrdersService {
  private async resolveSalesWarehouse(
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

  private async resolveGenericSupplier(
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

  private resolvePurchaseSuggestion(
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

  private async buildSalesStockDiagnosis(
    order: Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IOrderSalesStockDiagnosis> {
    const salesWarehouse = await this.resolveSalesWarehouse(
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
      this.resolveGenericSupplier(empresaId, db),
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
            ? this.resolvePurchaseSuggestion(
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

  async getSalesStockDiagnosis(
    id: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IOrderSalesStockDiagnosis> {
    const order = await (db as PrismaClient).order.findFirst({
      where: { id, empresaId },
      include: ORDER_INCLUDE,
    })

    if (!order) throw new NotFoundError(MSG.notFound)

    return this.buildSalesStockDiagnosis(order as any, empresaId, db)
  }

  async assertSalesWarehouseStockAvailable(
    id: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IOrderSalesStockDiagnosis> {
    const diagnosis = await this.getSalesStockDiagnosis(id, empresaId, db)

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

  async createSuggestedTransfers(
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

    const diagnosis = await this.buildSalesStockDiagnosis(order as any, empresaId, db)

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

    return {
      orderId: id,
      orderNumber: order.orderNumber,
      salesWarehouse: diagnosis.salesWarehouse,
      createdTransfers,
      shortages: diagnosis.shortages,
    }
  }

  async createSuggestedPurchaseOrders(
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

    const diagnosis = await this.buildSalesStockDiagnosis(order as any, empresaId, db)

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
      const genericSupplier = await this.resolveGenericSupplier(
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

  async createSuggestedReplenishmentPlan(
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

    const diagnosis = await this.buildSalesStockDiagnosis(order as any, empresaId, db)
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
      ? await this.resolveGenericSupplier(empresaId, db, true)
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

    return {
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
  }

  // -------------------------------------------------------------------------
  // CREATE
  // -------------------------------------------------------------------------

  async createWithItems(
    data: CreateOrderDTO,
    empresaId: string,
    userId?: string,
    db: PrismaClientType = {} as PrismaClient
  ): Promise<IOrder> {
    // Validate customer
    const customer = await (db as PrismaClient).customer.findFirst({
      where: { id: data.customerId, empresaId },
    })
    if (!customer) throw new NotFoundError('Cliente no encontrado')

    // Validate warehouse
    const warehouse = await (db as PrismaClient).warehouse.findFirst({
      where: { id: data.warehouseId, empresaId },
    })
    if (!warehouse) throw new NotFoundError('Almacén no encontrado')

    // Validate all items
    const itemIds = data.items.map((i) => i.itemId)
    const existingItems = await (db as PrismaClient).item.findMany({
      where: { id: { in: itemIds }, empresaId },
      select: { id: true, name: true },
    })
    if (existingItems.length !== itemIds.length) {
      throw new BadRequestError(
        'Uno o más artículos no existen o no pertenecen a esta empresa'
      )
    }
    const itemNameMap = new Map(existingItems.map((i) => [i.id, i.name]))

    // Calculate totals
    const igtfApplies = data.igtfApplies ?? false
    const globalDiscount = data.discountAmount ?? 0
    const calcItems = data.items.map((i) => ({
      quantityOrdered: i.quantity,
      unitCost: i.unitPrice,
      discountPercent: i.discountPercent ?? 0,
      taxType: (i.taxType as 'IVA' | 'EXEMPT' | 'REDUCED') ?? 'IVA',
    }))
    const totals = calculateOrderTotals(
      calcItems,
      globalDiscount,
      igtfApplies,
      data.taxRate ?? 16,
      data.igtfRate ?? 3
    )

    const orderNumber = generateOrderNumber()

    const order = await (db as PrismaClient).$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          status: OrderStatus.DRAFT,
          empresaId,
          customerId: data.customerId,
          warehouseId: data.warehouseId,
          currency: (data.currency as OrderCurrency) ?? OrderCurrency.USD,
          exchangeRate: data.exchangeRate ?? null,
          exchangeRateSource: data.exchangeRateSource ?? null,
          paymentTerms: data.paymentTerms ?? null,
          creditDays: data.creditDays ?? null,
          deliveryTerms: data.deliveryTerms ?? null,
          discountAmount: totals.discountAmount,
          subtotalBruto: totals.subtotalBruto,
          baseImponible: totals.baseImponible,
          baseExenta: totals.baseExenta,
          taxAmount: totals.taxAmount,
          taxRate: data.taxRate ?? 16,
          igtfApplies,
          igtfRate: data.igtfRate ?? 3,
          igtfAmount: totals.igtfAmount,
          total: totals.total,
          notes: data.notes ?? null,
          createdBy: userId ?? null,
        },
      })

      for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i]
        const itemTotals = totals.items[i]

        await tx.orderItem.create({
          data: {
            orderId: created.id,
            itemId: item.itemId,
            itemName: item.itemName || itemNameMap.get(item.itemId) || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountPercent: item.discountPercent ?? 0,
            discountAmount: itemTotals.discountAmount,
            taxType: (item.taxType as 'IVA' | 'EXEMPT' | 'REDUCED') ?? 'IVA',
            taxRate: itemTotals.taxRate,
            taxAmount: itemTotals.taxAmount,
            subtotal: itemTotals.subtotal,
            totalLine: itemTotals.totalLine,
          },
        })
      }

      return tx.order.findUnique({
        where: { id: created.id },
        include: ORDER_INCLUDE,
      })
    })

    if (!order) throw new Error('Error al crear la orden')

    logger.info(`Orden de venta creada: ${order.id}`, {
      orderNumber: order.orderNumber,
      empresaId,
      userId,
    })

    try {
      await domainEventBus.publish(
        toDomainEvent({
          empresaId,
          eventCode: 'sales.order.created',
          module: 'sales',
          title: `Orden ${order.orderNumber} creada`,
          message: `Se creó la orden de venta ${order.orderNumber}.`,
          type: 'info',
          entityType: 'ORDER',
          entityId: order.id,
          priority: 'MEDIUM',
          severity: 'INFO',
          link: `/empresa/ventas/ordenes/${order.id}`,
          source: 'sales.orders',
          dedupKey: `sales.order.created:${order.id}`,
          metadata: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            customerId: order.customerId,
          },
          createdById: userId ?? 'SYSTEM',
          createdByName: 'Sistema',
        })
      )
    } catch (publishError) {
      logger.error('Error publicando evento sales.order.created', {
        orderId: order.id,
        empresaId,
        error: publishError,
      })
    }

    return order as unknown as IOrder
  }

  // -------------------------------------------------------------------------
  // READ
  // -------------------------------------------------------------------------

  async findById(
    id: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IOrder> {
    const order = await (db as PrismaClient).order.findFirst({
      where: { id, empresaId },
      include: ORDER_INCLUDE,
    })
    if (!order) throw new NotFoundError(MSG.notFound)
    return order as unknown as IOrder
  }

  async findAll(
    filters: IOrderFilters,
    page: number,
    limit: number,
    empresaId: string,
    db: PrismaClientType,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: IOrder[]; total: number }> {
    const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

    const where: Prisma.OrderWhereInput = { empresaId }
    if (filters.status) where.status = filters.status as any
    if (filters.customerId) where.customerId = filters.customerId
    if (filters.warehouseId) where.warehouseId = filters.warehouseId
    if (filters.startDate || filters.endDate) {
      where.createdAt = {}
      if (filters.startDate) (where.createdAt as any).gte = filters.startDate
      if (filters.endDate) (where.createdAt as any).lte = filters.endDate
    }
    if (filters.search) {
      const search = filters.search.trim()
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { taxId: { contains: search, mode: 'insensitive' } } },
        { notes: { contains: search, mode: 'insensitive' } },
      ]
    }

    const validSortFields = new Set([
      'createdAt',
      'orderNumber',
      'status',
      'orderDate',
      'total',
    ])
    const safeSortBy = validSortFields.has(sortBy) ? sortBy : 'createdAt'

    const [data, total] = await Promise.all([
      (db as PrismaClient).order.findMany({
        where,
        include: ORDER_INCLUDE,
        orderBy: { [safeSortBy]: sortOrder },
        skip,
        take,
      }),
      (db as PrismaClient).order.count({ where }),
    ])

    return { data: data as unknown as IOrder[], total }
  }

  // -------------------------------------------------------------------------
  // UPDATE
  // -------------------------------------------------------------------------

  async update(
    id: string,
    data: UpdateOrderDTO,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IOrder> {
    const order = await (db as PrismaClient).order.findFirst({
      where: { id, empresaId },
      include: { items: true },
    })
    if (!order) throw new NotFoundError(MSG.notFound)

    if (order.status !== OrderStatus.DRAFT) {
      throw new BadRequestError(MSG.cannotEdit)
    }

    const updateData: Record<string, unknown> = {}
    if (data.customerId !== undefined) updateData.customerId = data.customerId
    if (data.warehouseId !== undefined)
      updateData.warehouseId = data.warehouseId
    if (data.currency !== undefined) updateData.currency = data.currency
    if (data.exchangeRate !== undefined)
      updateData.exchangeRate = data.exchangeRate
    if (data.exchangeRateSource !== undefined)
      updateData.exchangeRateSource = data.exchangeRateSource
    if (data.paymentTerms !== undefined)
      updateData.paymentTerms = data.paymentTerms
    if (data.creditDays !== undefined) updateData.creditDays = data.creditDays
    if (data.deliveryTerms !== undefined)
      updateData.deliveryTerms = data.deliveryTerms
    if (data.notes !== undefined) updateData.notes = data.notes ?? null

    // If items provided, replace all + recalculate
    const itemsProvided = Array.isArray(data.items) && data.items.length > 0

    if (itemsProvided) {
      const itemIds = data.items!.map((i) => i.itemId)
      const existingItems = await (db as PrismaClient).item.findMany({
        where: { id: { in: itemIds }, empresaId },
        select: { id: true, name: true },
      })
      if (existingItems.length !== itemIds.length) {
        throw new BadRequestError(
          'Uno o más artículos no existen o no pertenecen a esta empresa'
        )
      }
      const itemNameMap = new Map(existingItems.map((i) => [i.id, i.name]))

      const igtfApplies = data.igtfApplies ?? order.igtfApplies
      const globalDiscount = data.discountAmount ?? Number(order.discountAmount)

      const calcItems = data.items!.map((i) => ({
        quantityOrdered: i.quantity,
        unitCost: i.unitPrice,
        discountPercent: i.discountPercent ?? 0,
        taxType: (i.taxType as 'IVA' | 'EXEMPT' | 'REDUCED') ?? 'IVA',
      }))
      const totals = calculateOrderTotals(
        calcItems,
        globalDiscount,
        igtfApplies,
        data.taxRate ?? Number(order.taxRate),
        data.igtfRate ?? Number(order.igtfRate)
      )

      const updated = await (db as PrismaClient).$transaction(async (tx) => {
        // Delete old items
        await tx.orderItem.deleteMany({ where: { orderId: id } })

        // Create new items
        for (let i = 0; i < data.items!.length; i++) {
          const item = data.items![i]
          const itemTotals = totals.items[i]

          await tx.orderItem.create({
            data: {
              orderId: id,
              itemId: item.itemId,
              itemName: item.itemName || itemNameMap.get(item.itemId) || null,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discountPercent: item.discountPercent ?? 0,
              discountAmount: itemTotals.discountAmount,
              taxType: (item.taxType as 'IVA' | 'EXEMPT' | 'REDUCED') ?? 'IVA',
              taxRate: itemTotals.taxRate,
              taxAmount: itemTotals.taxAmount,
              subtotal: itemTotals.subtotal,
              totalLine: itemTotals.totalLine,
            },
          })
        }

        // Update header with recalculated totals
        return tx.order.update({
          where: { id },
          data: {
            ...updateData,
            discountAmount: totals.discountAmount,
            subtotalBruto: totals.subtotalBruto,
            baseImponible: totals.baseImponible,
            baseExenta: totals.baseExenta,
            taxAmount: totals.taxAmount,
            igtfApplies,
            igtfAmount: totals.igtfAmount,
            total: totals.total,
          },
          include: ORDER_INCLUDE,
        })
      })

      logger.info(`Orden actualizada con items: ${id}`, { empresaId })
      return updated as unknown as IOrder
    }

    // No items — header only, recalc if financial fields changed
    const financialChanged =
      data.discountAmount !== undefined || data.igtfApplies !== undefined

    if (financialChanged) {
      const igtfApplies = data.igtfApplies ?? order.igtfApplies
      const globalDiscount = data.discountAmount ?? Number(order.discountAmount)

      const calcItems = (order.items as any[]).map((i: any) => ({
        quantityOrdered: i.quantity,
        unitCost: Number(i.unitPrice),
        discountPercent: Number(i.discountPercent),
        taxType: i.taxType as 'IVA' | 'EXEMPT' | 'REDUCED',
      }))

      const totals = calculateOrderTotals(
        calcItems,
        globalDiscount,
        igtfApplies,
        Number(order.taxRate),
        Number(order.igtfRate)
      )

      updateData.discountAmount = totals.discountAmount
      updateData.subtotalBruto = totals.subtotalBruto
      updateData.baseImponible = totals.baseImponible
      updateData.baseExenta = totals.baseExenta
      updateData.taxAmount = totals.taxAmount
      updateData.igtfApplies = igtfApplies
      updateData.igtfAmount = totals.igtfAmount
      updateData.total = totals.total
    }

    const updated = await (db as PrismaClient).order.update({
      where: { id },
      data: updateData,
      include: ORDER_INCLUDE,
    })

    logger.info(`Orden actualizada: ${id}`, { empresaId })
    return updated as unknown as IOrder
  }

  // -------------------------------------------------------------------------
  // APPROVE — generates PreInvoice automatically
  // -------------------------------------------------------------------------

  async approve(
    id: string,
    empresaId: string,
    approvedBy: string,
    db: PrismaClientType
  ): Promise<IOrder> {
    const order = await (db as PrismaClient).order.findFirst({
      where: { id, empresaId },
      include: ORDER_INCLUDE,
    })
    if (!order) throw new NotFoundError(MSG.notFound)

    if (order.status !== OrderStatus.DRAFT) {
      throw new BadRequestError(
        `No se puede aprobar una orden con estado ${order.status}`
      )
    }

    if (!order.items || (order.items as any[]).length === 0) {
      throw new BadRequestError('La orden debe tener al menos un artículo')
    }

    // Check no PreInvoice already exists
    const existingPI = await (db as PrismaClient).preInvoice.findUnique({
      where: { orderId: id },
    })
    if (existingPI) {
      throw new BadRequestError('Esta orden ya tiene una pre-factura generada')
    }

    const salesStockDiagnosis = await this.buildSalesStockDiagnosis(
      order as any,
      empresaId,
      db
    )

    if (salesStockDiagnosis.hasShortages) {
      throw new BadRequestError(
        'No hay stock suficiente en el almacén de venta para aprobar esta orden.',
        [
          {
            code: 'SALES_STOCK_SHORTAGE',
            scope: 'ORDER',
            ...salesStockDiagnosis,
          } as any,
        ]
      )
    }

    const preInvoiceNumber = generatePreInvoiceNumber()

    const updated = await (db as PrismaClient).$transaction(async (tx) => {
      // 1. Update order status
      const approvedOrder = await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.APPROVED,
          approvedBy,
          approvedAt: new Date(),
        },
      })

      // 2. Create PreInvoice copying ALL fiscal data from Order
      const preInvoice = await tx.preInvoice.create({
        data: {
          preInvoiceNumber,
          status: 'PENDING_PREPARATION',
          empresaId,
          orderId: id,
          customerId: order.customerId,
          warehouseId: salesStockDiagnosis.salesWarehouse.id,
          currency: (order as any).currency ?? 'USD',
          exchangeRate: (order as any).exchangeRate ?? null,
          discountAmount: (order as any).discountAmount ?? order.discount ?? 0,
          subtotalBruto: (order as any).subtotalBruto ?? order.subtotal ?? 0,
          baseImponible: (order as any).baseImponible ?? 0,
          baseExenta: (order as any).baseExenta ?? 0,
          taxAmount: (order as any).taxAmount ?? order.tax ?? 0,
          taxRate: (order as any).taxRate ?? 16,
          igtfApplies: (order as any).igtfApplies ?? false,
          igtfRate: (order as any).igtfRate ?? 3,
          igtfAmount: (order as any).igtfAmount ?? 0,
          total: order.total ?? 0,
          notes: order.notes ?? null,
        },
      })

      // 3. Copy items from Order to PreInvoice with fiscal data
      const orderItems = order.items as any[]
      for (const item of orderItems) {
        await tx.preInvoiceItem.create({
          data: {
            preInvoiceId: preInvoice.id,
            itemId: item.itemId,
            itemName: item.itemName ?? null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountPercent: item.discountPercent ?? 0,
            discountAmount: item.discountAmount ?? item.discount ?? 0,
            taxType: (item.taxType as 'IVA' | 'EXEMPT' | 'REDUCED') ?? 'IVA',
            taxRate: item.taxRate ?? 16,
            taxAmount: item.taxAmount ?? 0,
            subtotal: item.subtotal ?? 0,
            totalLine: item.totalLine ?? 0,
            notes: item.notes ?? null,
          },
        })
      }

      // 4. Return updated order with relations
      return tx.order.findUnique({
        where: { id },
        include: {
          ...ORDER_INCLUDE,
          preInvoice: true,
        },
      })
    })

    if (!updated) throw new Error('Error al aprobar la orden')

    logger.info(`Orden aprobada con pre-factura: ${id}`, {
      preInvoiceNumber,
      approvedBy,
      empresaId,
    })

    try {
      await domainEventBus.publish(
        toDomainEvent({
          empresaId,
          eventCode: 'sales.order.approved',
          module: 'sales',
          title: `Orden ${updated.orderNumber} aprobada`,
          message: `La orden ${updated.orderNumber} fue aprobada.`,
          type: 'success',
          entityType: 'ORDER',
          entityId: updated.id,
          priority: 'MEDIUM',
          severity: 'SUCCESS',
          link: `/empresa/ventas/ordenes/${updated.id}`,
          source: 'sales.orders',
          dedupKey: `sales.order.approved:${updated.id}`,
          metadata: {
            orderId: updated.id,
            orderNumber: updated.orderNumber,
            preInvoiceNumber,
          },
          createdById: approvedBy,
          createdByName: 'Sistema',
        })
      )

      const preInvoiceId = (updated as any).preInvoice?.id
      if (typeof preInvoiceId === 'string' && preInvoiceId) {
        await domainEventBus.publish(
          toDomainEvent({
            empresaId,
            eventCode: 'sales.pre_invoice.created',
            module: 'sales',
            title: `Pre-factura ${preInvoiceNumber} creada`,
            message: `Se generó la pre-factura ${preInvoiceNumber}.`,
            type: 'info',
            entityType: 'PRE_INVOICE',
            entityId: preInvoiceId,
            priority: 'MEDIUM',
            severity: 'INFO',
            link: `/empresa/ventas/prefacturas/${preInvoiceId}`,
            source: 'sales.orders',
            dedupKey: `sales.pre_invoice.created:${preInvoiceId}`,
            metadata: {
              preInvoiceId,
              preInvoiceNumber,
              orderId: updated.id,
              orderNumber: updated.orderNumber,
            },
            createdById: approvedBy,
            createdByName: 'Sistema',
          })
        )
      }
    } catch (publishError) {
      logger.error('Error publicando eventos de aprobación de orden', {
        orderId: updated.id,
        empresaId,
        error: publishError,
      })
    }

    return updated as unknown as IOrder
  }

  // -------------------------------------------------------------------------
  // CANCEL
  // -------------------------------------------------------------------------

  async cancel(
    id: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IOrder> {
    const order = await (db as PrismaClient).order.findFirst({
      where: { id, empresaId },
    })
    if (!order) throw new NotFoundError(MSG.notFound)

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestError('La orden ya está cancelada')
    }

    const updated = await (db as PrismaClient).order.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED },
      include: ORDER_INCLUDE,
    })

    logger.info(`Orden cancelada: ${id}`, { empresaId })

    try {
      await domainEventBus.publish(
        toDomainEvent({
          empresaId,
          eventCode: 'sales.order.cancelled',
          module: 'sales',
          title: `Orden ${updated.orderNumber} cancelada`,
          message: `La orden ${updated.orderNumber} fue cancelada.`,
          type: 'warning',
          entityType: 'ORDER',
          entityId: updated.id,
          priority: 'HIGH',
          severity: 'WARNING',
          link: `/empresa/ventas/ordenes/${updated.id}`,
          source: 'sales.orders',
          dedupKey: `sales.order.cancelled:${updated.id}`,
          metadata: {
            orderId: updated.id,
            orderNumber: updated.orderNumber,
          },
          createdById: 'SYSTEM',
          createdByName: 'Sistema',
        })
      )
    } catch (publishError) {
      logger.error('Error publicando evento sales.order.cancelled', {
        orderId: updated.id,
        empresaId,
        error: publishError,
      })
    }

    return updated as unknown as IOrder
  }

  // -------------------------------------------------------------------------
  // DELETE
  // -------------------------------------------------------------------------

  async delete(
    id: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<{ success: boolean; id: string }> {
    const order = await (db as PrismaClient).order.findFirst({
      where: { id, empresaId },
    })
    if (!order) throw new NotFoundError(MSG.notFound)

    if (order.status !== OrderStatus.DRAFT) {
      throw new BadRequestError(
        'Solo se pueden eliminar órdenes en estado DRAFT'
      )
    }

    await (db as PrismaClient).order.delete({ where: { id } })

    logger.info(`Orden eliminada: ${id}`, { empresaId })
    return { success: true, id }
  }
}

export default new OrdersService()
