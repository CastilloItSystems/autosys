// backend/src/features/inventory/purchaseOrders/purchaseOrders.service.ts

import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import prisma from '../../../services/prisma.service.js'
import { logger } from '../../../shared/utils/logger.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import {
  NotFoundError,
  BadRequestError,
} from '../../../shared/utils/apiError.js'
import { INVENTORY_MESSAGES } from '../shared/constants/messages.js'
import { MovementNumberGenerator } from '../shared/utils/movementNumberGenerator.js'
import {
  IPurchaseOrderWithRelations,
  IPurchaseOrderItem,
  ICreatePurchaseOrderInput,
  IUpdatePurchaseOrderInput,
  IPurchaseOrderFilters,
  ICreatePurchaseOrderItemInput,
  ICreatePurchaseOrderWithItemsInput,
  IReceiveOrderInput,
  PurchaseOrderStatus,
  PurchaseOrderCurrency,
} from './purchaseOrders.interface.js'
import { calculateOrderTotals } from '../shared/utils/calculateOrderTotals.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PO_INCLUDE = {
  supplier: true,
  warehouse: true,
  items: { include: { item: true } },
} as const

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate a PO number that avoids race conditions.
 * Uses timestamp + random suffix instead of count().
 */
function generateOrderNumber(): string {
  const year = new Date().getFullYear()
  const ts = Date.now().toString(36).toUpperCase()
  const rnd = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `PO-${year}-${ts}${rnd}`
}

/**
 * Generate an entry note number for receiveOrder.
 * Uses timestamp + random suffix instead of count().
 */
function generateEntryNoteNumber(): string {
  const year = new Date().getFullYear()
  const ts = Date.now().toString(36).toUpperCase()
  const rnd = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `EN-${year}-${ts}${rnd}`
}

/** Add quantityPending to PO items (computed field not in DB). */
function enrichWithQuantityPending(
  po: Record<string, unknown>
): Record<string, unknown> {
  if (!po) return po
  const items = po.items as Array<Record<string, unknown>> | undefined
  if (Array.isArray(items)) {
    po.items = items.map((item) => ({
      ...item,
      quantityPending:
        (item.quantityOrdered as number) - (item.quantityReceived as number),
    }))
  }
  return po
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class PurchaseOrderService {
  // -------------------------------------------------------------------------
  // CREATE
  // -------------------------------------------------------------------------

  /**
   * Crear orden de compra vacía.
   * @param empresaId - REQUIRED: tenant safety
   */
  async create(
    data: ICreatePurchaseOrderInput,
    empresaId: string,
    userId?: string,
    db: PrismaClientType = prisma
  ): Promise<IPurchaseOrderWithRelations> {
    // TENANT-SAFE: supplier is in tenantModels — req.prisma auto-filters
    // but we still validate explicitly for clear error messages
    const supplier = await db.supplier.findFirst({
      where: { id: data.supplierId, empresaId },
    })
    if (!supplier) throw new NotFoundError(INVENTORY_MESSAGES.supplier.notFound)

    // TENANT-SAFE: warehouse is in tenantModels
    const warehouse = await db.warehouse.findFirst({
      where: { id: data.warehouseId, empresaId },
    })
    if (!warehouse)
      throw new NotFoundError(INVENTORY_MESSAGES.warehouse.notFound)

    const orderNumber = generateOrderNumber()

    const po = await db.purchaseOrder.create({
      data: {
        orderNumber,
        supplierId: data.supplierId,
        warehouseId: data.warehouseId,
        currency: data.currency ?? PurchaseOrderCurrency.USD,
        exchangeRate: data.exchangeRate ?? null,
        paymentTerms: data.paymentTerms ?? null,
        creditDays: data.creditDays ?? null,
        deliveryTerms: data.deliveryTerms ?? null,
        discountAmount: data.discountAmount ?? 0,
        subtotalBruto: data.subtotalBruto ?? 0,
        baseImponible: data.baseImponible ?? 0,
        baseExenta: data.baseExenta ?? 0,
        taxAmount: data.taxAmount ?? 0,
        taxRate: data.taxRate ?? 16,
        igtfApplies: data.igtfApplies ?? false,
        igtfRate: data.igtfRate ?? 3,
        igtfAmount: data.igtfAmount ?? 0,
        status: PurchaseOrderStatus.DRAFT,
        total: data.total ?? 0,
        notes: data.notes ?? null,
        expectedDate: data.expectedDate ?? null,
        createdBy: userId ?? data.createdBy ?? null,
      },
      include: PO_INCLUDE,
    })

    logger.info(`Orden de compra creada: ${po.id}`, {
      orderNumber: po.orderNumber,
      empresaId,
      userId,
    })

    return enrichWithQuantityPending(
      po as unknown as Record<string, unknown>
    ) as unknown as IPurchaseOrderWithRelations
  }

  /**
   * Crear orden de compra CON items en una sola transacción.
   * @param empresaId - REQUIRED: tenant safety
   */
  async createWithItems(
    data: ICreatePurchaseOrderWithItemsInput,
    empresaId: string,
    userId?: string,
    db: PrismaClientType = prisma
  ): Promise<IPurchaseOrderWithRelations> {
    // TENANT-SAFE: validate supplier and warehouse belong to this company
    const supplier = await db.supplier.findFirst({
      where: { id: data.supplierId, empresaId },
    })
    if (!supplier) throw new NotFoundError(INVENTORY_MESSAGES.supplier.notFound)

    const warehouse = await db.warehouse.findFirst({
      where: { id: data.warehouseId, empresaId },
    })
    if (!warehouse)
      throw new NotFoundError(INVENTORY_MESSAGES.warehouse.notFound)

    // TENANT-SAFE: validate all items belong to this company
    const itemIds = data.items.map((i) => i.itemId)
    const existingItems = await db.item.findMany({
      where: { id: { in: itemIds }, empresaId },
      select: { id: true },
    })
    if (existingItems.length !== itemIds.length) {
      throw new BadRequestError(
        'Uno o más artículos no existen o no pertenecen a esta empresa'
      )
    }

    const igtfApplies = data.igtfApplies ?? false
    const globalDiscountAmount = data.discountAmount ?? 0
    const totals = calculateOrderTotals(
      data.items,
      globalDiscountAmount,
      igtfApplies,
      data.taxRate ?? 16,
      data.igtfRate ?? 3
    )

    const orderNumber = generateOrderNumber()

    const po = await (db as PrismaClient).$transaction(async (tx) => {
      const createdPO = await tx.purchaseOrder.create({
        data: {
          orderNumber,
          supplierId: data.supplierId,
          warehouseId: data.warehouseId,
          currency: data.currency ?? PurchaseOrderCurrency.USD,
          exchangeRate: data.exchangeRate ?? null,
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
          status: PurchaseOrderStatus.DRAFT,
          total: totals.total,
          notes: data.notes ?? null,
          expectedDate: data.expectedDate ?? null,
          createdBy: userId ?? data.createdBy ?? null,
        },
      })

      for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i]
        const itemTotals = totals.items[i]

        await tx.purchaseOrderItem.create({
          data: {
            purchaseOrderId: createdPO.id,
            itemId: item.itemId,
            quantityOrdered: item.quantityOrdered,
            quantityReceived: 0,
            quantityPending: item.quantityOrdered,
            unitCost: item.unitCost,
            discountPercent: item.discountPercent ?? 0,
            discountAmount: itemTotals.discountAmount,
            taxType: item.taxType,
            taxRate: itemTotals.taxRate,
            taxAmount: itemTotals.taxAmount,
            subtotal: itemTotals.subtotal,
            totalLine: itemTotals.totalLine,
          },
        })
      }

      return tx.purchaseOrder.findUnique({
        where: { id: createdPO.id },
        include: PO_INCLUDE,
      })
    })

    if (!po) throw new Error('Error al crear la orden de compra')

    logger.info(
      `Orden de compra creada con ${data.items.length} items: ${po.id}`,
      {
        orderNumber: po.orderNumber,
        empresaId,
        userId,
      }
    )

    return enrichWithQuantityPending(
      po as unknown as Record<string, unknown>
    ) as unknown as IPurchaseOrderWithRelations
  }

  // -------------------------------------------------------------------------
  // READ
  // -------------------------------------------------------------------------

  /**
   * Obtener orden de compra por ID.
   * @param empresaId - REQUIRED: tenant safety via warehouse
   */
  async findById(
    id: string,
    empresaId: string,
    includeItems: boolean = true,
    db: PrismaClientType = prisma
  ): Promise<IPurchaseOrderWithRelations> {
    // TENANT-SAFE: PurchaseOrder tenant via warehouse.empresaId
    const po = await db.purchaseOrder.findFirst({
      where: { id, warehouse: { empresaId } },
      include: {
        supplier: true,
        warehouse: true,
        ...(includeItems ? { items: { include: { item: true } } } : {}),
      },
    })

    if (!po) throw new NotFoundError(INVENTORY_MESSAGES.purchaseOrder.notFound)

    return enrichWithQuantityPending(
      po as unknown as Record<string, unknown>
    ) as unknown as IPurchaseOrderWithRelations
  }

  /**
   * Obtener todas las órdenes de compra con filtros y paginación.
   * @param empresaId - REQUIRED: tenant safety
   */
  async findAll(
    filters: IPurchaseOrderFilters = {},
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'orderDate',
    sortOrder: 'asc' | 'desc' = 'desc',
    empresaId: string,
    db: PrismaClientType = prisma
  ): Promise<{
    items: IPurchaseOrderWithRelations[]
    total: number
    page: number
    limit: number
  }> {
    const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

    // TENANT-SAFE: always scope via warehouse.empresaId
    const where: Record<string, unknown> = { warehouse: { empresaId } }

    if (filters.status) where.status = filters.status
    if (filters.supplierId) where.supplierId = filters.supplierId
    if (filters.warehouseId) where.warehouseId = filters.warehouseId
    if (filters.createdBy) where.createdBy = filters.createdBy

    if (filters.orderFrom || filters.orderTo) {
      const orderDate: Record<string, Date> = {}
      if (filters.orderFrom) orderDate.gte = filters.orderFrom
      if (filters.orderTo) orderDate.lte = filters.orderTo
      where.orderDate = orderDate
    }

    const [total, pos] = await Promise.all([
      db.purchaseOrder.count({ where }),
      db.purchaseOrder.findMany({
        where,
        include: PO_INCLUDE,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
      }),
    ])

    return {
      items: (pos as unknown as Record<string, unknown>[]).map(
        (po) =>
          enrichWithQuantityPending(
            po
          ) as unknown as IPurchaseOrderWithRelations
      ),
      total,
      page,
      limit,
    }
  }

  // -------------------------------------------------------------------------
  // UPDATE
  // -------------------------------------------------------------------------

  /**
   * Actualizar campos de la orden de compra.
   * @param empresaId - REQUIRED: tenant safety
   */
  async update(
    id: string,
    data: IUpdatePurchaseOrderInput,
    empresaId: string,
    db: PrismaClientType = prisma
  ): Promise<IPurchaseOrderWithRelations> {
    // TENANT-SAFE: verify via warehouse
    const po = await db.purchaseOrder.findFirst({
      where: { id, warehouse: { empresaId } },
      include: { items: true },
    })
    if (!po) throw new NotFoundError(INVENTORY_MESSAGES.purchaseOrder.notFound)

    if (
      data.status === PurchaseOrderStatus.CANCELLED &&
      po.status === PurchaseOrderStatus.COMPLETED
    ) {
      throw new BadRequestError('No se puede cancelar una orden completada')
    }

    const updateData: Record<string, unknown> = {}
    if (data.status !== undefined) updateData.status = data.status
    if (data.currency !== undefined) updateData.currency = data.currency
    if (data.exchangeRate !== undefined)
      updateData.exchangeRate = data.exchangeRate
    if (data.paymentTerms !== undefined)
      updateData.paymentTerms = data.paymentTerms
    if (data.creditDays !== undefined) updateData.creditDays = data.creditDays
    if (data.deliveryTerms !== undefined)
      updateData.deliveryTerms = data.deliveryTerms
    if (data.notes !== undefined) updateData.notes = data.notes ?? null
    if (data.expectedDate !== undefined)
      updateData.expectedDate = data.expectedDate ?? null

    // If financial fields change while in DRAFT, we must recalculate totals
    const isDraft =
      po.status === PurchaseOrderStatus.DRAFT ||
      (data.status && data.status === PurchaseOrderStatus.DRAFT)
    const financialFieldsChanged =
      data.discountAmount !== undefined || data.igtfApplies !== undefined

    if (isDraft && financialFieldsChanged) {
      const newDiscountAmount = data.discountAmount ?? Number(po.discountAmount)
      const newIgtfApplies = data.igtfApplies ?? po.igtfApplies

      const itemsForCalc = po.items.map((i) => ({
        quantityOrdered: i.quantityOrdered,
        unitCost: Number(i.unitCost),
        discountPercent: Number(i.discountPercent),
        taxType: i.taxType as any,
      }))

      const newTotals = calculateOrderTotals(
        itemsForCalc,
        newDiscountAmount,
        newIgtfApplies,
        Number(po.taxRate),
        Number(po.igtfRate)
      )

      updateData.discountAmount = newTotals.discountAmount
      updateData.subtotalBruto = newTotals.subtotalBruto
      updateData.baseImponible = newTotals.baseImponible
      updateData.baseExenta = newTotals.baseExenta
      updateData.taxAmount = newTotals.taxAmount
      updateData.igtfApplies = newIgtfApplies
      updateData.igtfAmount = newTotals.igtfAmount
      updateData.total = newTotals.total
    }

    const updated = await db.purchaseOrder.update({
      where: { id },
      data: updateData,
      include: PO_INCLUDE,
    })

    logger.info(`Orden de compra actualizada: ${id}`, { empresaId })

    return enrichWithQuantityPending(
      updated as unknown as Record<string, unknown>
    ) as unknown as IPurchaseOrderWithRelations
  }

  // -------------------------------------------------------------------------
  // OPERATIONS
  // -------------------------------------------------------------------------

  /**
   * Aprobar orden (DRAFT → SENT).
   * @param empresaId - REQUIRED: tenant safety
   */
  async approve(
    id: string,
    empresaId: string,
    approvedBy: string,
    db: PrismaClientType = prisma
  ): Promise<IPurchaseOrderWithRelations> {
    // TENANT-SAFE: verify via warehouse
    const po = await db.purchaseOrder.findFirst({
      where: { id, warehouse: { empresaId } },
    })
    if (!po) throw new NotFoundError(INVENTORY_MESSAGES.purchaseOrder.notFound)

    if (po.status !== PurchaseOrderStatus.DRAFT) {
      throw new BadRequestError(
        `No se puede aprobar una orden con estado ${po.status}`
      )
    }

    const itemCount = await db.purchaseOrderItem.count({
      where: { purchaseOrderId: id },
    })
    if (itemCount === 0) {
      throw new BadRequestError(
        'La orden de compra debe tener al menos un item'
      )
    }

    const updated = await db.purchaseOrder.update({
      where: { id },
      data: {
        status: PurchaseOrderStatus.SENT,
        approvedBy,
        approvedAt: new Date(),
      },
      include: PO_INCLUDE,
    })

    logger.info(`Orden de compra aprobada: ${id}`, { approvedBy, empresaId })

    return enrichWithQuantityPending(
      updated as unknown as Record<string, unknown>
    ) as unknown as IPurchaseOrderWithRelations
  }

  /**
   * Cancelar orden de compra.
   * @param empresaId - REQUIRED: tenant safety
   */
  async cancel(
    id: string,
    empresaId: string,
    db: PrismaClientType = prisma
  ): Promise<IPurchaseOrderWithRelations> {
    // TENANT-SAFE: verify via warehouse
    const po = await db.purchaseOrder.findFirst({
      where: { id, warehouse: { empresaId } },
    })
    if (!po) throw new NotFoundError(INVENTORY_MESSAGES.purchaseOrder.notFound)

    if (po.status === PurchaseOrderStatus.COMPLETED) {
      throw new BadRequestError('No se puede cancelar una orden completada')
    }
    if (po.status === PurchaseOrderStatus.CANCELLED) {
      throw new BadRequestError('La orden ya está cancelada')
    }

    const updated = await db.purchaseOrder.update({
      where: { id },
      data: { status: PurchaseOrderStatus.CANCELLED },
      include: PO_INCLUDE,
    })

    logger.info(`Orden de compra cancelada: ${id}`, { empresaId })

    return enrichWithQuantityPending(
      updated as unknown as Record<string, unknown>
    ) as unknown as IPurchaseOrderWithRelations
  }

  // -------------------------------------------------------------------------
  // ITEMS
  // -------------------------------------------------------------------------

  /**
   * Agregar item a la orden y recalcular totales — atómico.
   * @param empresaId - REQUIRED: tenant safety
   */
  async addItem(
    poId: string,
    data: ICreatePurchaseOrderItemInput,
    empresaId: string,
    db: PrismaClientType = prisma
  ): Promise<IPurchaseOrderItem> {
    const poItem = await (db as PrismaClient).$transaction(async (tx) => {
      // TENANT-SAFE: verify PO via warehouse
      const po = await tx.purchaseOrder.findFirst({
        where: { id: poId, warehouse: { empresaId } },
      })
      if (!po)
        throw new NotFoundError(INVENTORY_MESSAGES.purchaseOrder.notFound)

      if (po.status !== PurchaseOrderStatus.DRAFT) {
        throw new BadRequestError(
          'Solo se pueden agregar items a órdenes en estado DRAFT'
        )
      }

      // TENANT-SAFE: item belongs to this company
      const item = await tx.item.findFirst({
        where: { id: data.itemId, empresaId },
      })
      if (!item) throw new NotFoundError(INVENTORY_MESSAGES.item.notFound)

      // Pre-fetch existing items to calculate the new order total
      const existingItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: poId },
      })

      const calcItems = existingItems.map((i) => ({
        quantityOrdered: i.quantityOrdered,
        unitCost: Number(i.unitCost),
        discountPercent: Number(i.discountPercent),
        taxType: i.taxType as any,
      }))

      // Add the new item to the calculation
      calcItems.push({
        quantityOrdered: data.quantityOrdered,
        unitCost: data.unitCost,
        discountPercent: data.discountPercent ?? 0,
        taxType: data.taxType as any,
      })

      const newTotals = calculateOrderTotals(
        calcItems,
        Number(po.discountAmount),
        po.igtfApplies,
        Number(po.taxRate),
        Number(po.igtfRate)
      )

      const newItemTotals = newTotals.items[newTotals.items.length - 1]

      const created = await tx.purchaseOrderItem.create({
        data: {
          purchaseOrderId: poId,
          itemId: data.itemId,
          quantityOrdered: data.quantityOrdered,
          quantityReceived: 0,
          quantityPending: data.quantityOrdered,
          unitCost: data.unitCost,
          discountPercent: data.discountPercent ?? 0,
          discountAmount: newItemTotals.discountAmount,
          taxType: data.taxType,
          taxRate: newItemTotals.taxRate,
          taxAmount: newItemTotals.taxAmount,
          subtotal: newItemTotals.subtotal,
          totalLine: newItemTotals.totalLine,
        },
      })

      // Recalculate PO totals atomically
      await tx.purchaseOrder.update({
        where: { id: poId },
        data: {
          subtotalBruto: newTotals.subtotalBruto,
          baseImponible: newTotals.baseImponible,
          baseExenta: newTotals.baseExenta,
          taxAmount: newTotals.taxAmount,
          igtfAmount: newTotals.igtfAmount,
          total: newTotals.total,
        },
      })

      logger.info(`Item agregado a orden de compra: ${poId}`, {
        itemId: data.itemId,
        quantity: data.quantityOrdered,
        empresaId,
      })

      return created
    })

    return {
      ...poItem,
      quantityPending:
        (poItem.quantityOrdered as number) -
        (poItem.quantityReceived as number),
      unitCost: parseFloat(String(poItem.unitCost)),
      subtotal: parseFloat(String(poItem.subtotal)),
      totalLine: parseFloat(String(poItem.totalLine)),
      discountAmount: parseFloat(String(poItem.discountAmount)),
      taxAmount: parseFloat(String(poItem.taxAmount)),
    } as unknown as IPurchaseOrderItem
  }

  /**
   * Obtener items de una orden de compra.
   * @param empresaId - REQUIRED: tenant safety
   */
  async getItems(
    poId: string,
    empresaId: string,
    db: PrismaClientType = prisma
  ): Promise<IPurchaseOrderItem[]> {
    // TENANT-SAFE: verify PO exists and belongs to this company
    const po = await db.purchaseOrder.findFirst({
      where: { id: poId, warehouse: { empresaId } },
    })
    if (!po) throw new NotFoundError(INVENTORY_MESSAGES.purchaseOrder.notFound)

    const items = await db.purchaseOrderItem.findMany({
      where: { purchaseOrderId: poId },
      include: { item: { select: { id: true, sku: true, name: true } } },
    })

    return items.map((item) => ({
      ...item,
      quantityPending: item.quantityOrdered - item.quantityReceived,
      unitCost: parseFloat(String(item.unitCost)),
      subtotal: parseFloat(String(item.subtotal)),
      totalLine: parseFloat(String(item.totalLine)),
      discountAmount: parseFloat(String(item.discountAmount)),
      taxAmount: parseFloat(String(item.taxAmount)),
    })) as unknown as IPurchaseOrderItem[]
  }

  // -------------------------------------------------------------------------
  // DELETE
  // -------------------------------------------------------------------------

  /**
   * Eliminar orden (solo DRAFT). Items se eliminan por cascade.
   * @param empresaId - REQUIRED: tenant safety
   */
  async delete(
    id: string,
    empresaId: string,
    db: PrismaClientType = prisma
  ): Promise<{ success: boolean; id: string }> {
    // TENANT-SAFE: verify via warehouse
    const po = await db.purchaseOrder.findFirst({
      where: { id, warehouse: { empresaId } },
    })
    if (!po) throw new NotFoundError(INVENTORY_MESSAGES.purchaseOrder.notFound)

    if (po.status !== PurchaseOrderStatus.DRAFT) {
      throw new BadRequestError(
        'Solo se pueden eliminar órdenes en estado DRAFT'
      )
    }

    // Items deleted by onDelete: Cascade on PurchaseOrderItem
    await db.purchaseOrder.delete({ where: { id } })

    logger.info(`Orden de compra eliminada: ${id}`, { empresaId })

    return { success: true, id }
  }

  // -------------------------------------------------------------------------
  // RECEIVE ORDER
  // -------------------------------------------------------------------------

  /**
   * Recepcionar mercancía de una OC.
   * Crea EntryNote + items, actualiza PO quantities, upsert Stock, crea Movements.
   * Todo en una transacción atómica.
   * @param empresaId - REQUIRED: tenant safety
   */
  async receiveOrder(
    poId: string,
    data: IReceiveOrderInput,
    empresaId: string,
    userId?: string,
    db: PrismaClientType = prisma
  ): Promise<IPurchaseOrderWithRelations> {
    // TENANT-SAFE: verify PO via warehouse before entering transaction
    const po = await db.purchaseOrder.findFirst({
      where: { id: poId, warehouse: { empresaId } },
      include: { items: true, warehouse: true },
    })
    if (!po) throw new NotFoundError(INVENTORY_MESSAGES.purchaseOrder.notFound)

    if (
      [
        PurchaseOrderStatus.COMPLETED,
        PurchaseOrderStatus.CANCELLED,
        PurchaseOrderStatus.DRAFT,
      ].includes(po.status as PurchaseOrderStatus)
    ) {
      throw new BadRequestError(
        `No se puede recepcionar una orden con estado ${po.status}. Debe estar en SENT o PARTIAL.`
      )
    }

    const warehouseId = data.warehouseId ?? po.warehouseId

    // TENANT-SAFE: validate target warehouse belongs to this company
    const warehouse = await db.warehouse.findFirst({
      where: { id: warehouseId, empresaId },
    })
    if (!warehouse)
      throw new NotFoundError(INVENTORY_MESSAGES.warehouse.notFound)

    // Validate quantities vs pending
    for (const receiveItem of data.items) {
      const poItem = po.items.find((i) => i.itemId === receiveItem.itemId)
      if (!poItem) {
        throw new BadRequestError(
          `El artículo ${receiveItem.itemId} no pertenece a esta orden de compra`
        )
      }
      if (receiveItem.quantityReceived > poItem.quantityPending) {
        throw new BadRequestError(
          `La cantidad a recibir (${receiveItem.quantityReceived}) excede la pendiente (${poItem.quantityPending}) para el artículo ${receiveItem.itemId}`
        )
      }
    }

    const entryNoteNumber = generateEntryNoteNumber()

    const result = await (db as PrismaClient).$transaction(async (tx) => {
      // 1. Create EntryNote (PURCHASE, COMPLETED)
      const entryNote = await tx.entryNote.create({
        data: {
          entryNoteNumber,
          type: 'PURCHASE',
          status: 'COMPLETED',
          purchaseOrderId: poId,
          warehouseId,
          notes: data.notes ?? null,
          receivedBy: data.receivedBy ?? userId ?? null,
          receivedAt: new Date(),
          verifiedAt: new Date(),
        },
      })

      // 2. For each received item
      for (const receiveItem of data.items) {
        const poItem = po.items.find((i) => i.itemId === receiveItem.itemId)!

        // 2a. Create EntryNoteItem
        await tx.entryNoteItem.create({
          data: {
            entryNoteId: entryNote.id,
            itemId: receiveItem.itemId,
            quantityReceived: receiveItem.quantityReceived,
            unitCost: receiveItem.unitCost,
            batchNumber: receiveItem.batchNumber ?? null,
            expiryDate: receiveItem.expiryDate ?? null,
          },
        })

        // 2b. Update PurchaseOrderItem quantities
        const newQuantityReceived =
          poItem.quantityReceived + receiveItem.quantityReceived
        const newQuantityPending = Math.max(
          0,
          poItem.quantityOrdered - newQuantityReceived
        )

        await tx.purchaseOrderItem.update({
          where: { id: poItem.id },
          data: {
            quantityReceived: newQuantityReceived,
            quantityPending: newQuantityPending,
          },
        })

        // 2c. Upsert Stock with weighted average cost
        const existingStock = await tx.stock.findUnique({
          where: {
            itemId_warehouseId: { itemId: receiveItem.itemId, warehouseId },
          },
        })

        if (existingStock) {
          const newReal =
            existingStock.quantityReal + receiveItem.quantityReceived
          const newAvailable =
            existingStock.quantityAvailable + receiveItem.quantityReceived
          const existingTotal =
            existingStock.quantityReal *
            parseFloat(String(existingStock.averageCost))
          const newAverageCost =
            newReal > 0
              ? (existingTotal +
                  receiveItem.quantityReceived * receiveItem.unitCost) /
                newReal
              : receiveItem.unitCost

          await tx.stock.update({
            where: { id: existingStock.id },
            data: {
              quantityReal: newReal,
              quantityAvailable: newAvailable,
              averageCost: newAverageCost,
              lastMovementAt: new Date(),
            },
          })
        } else {
          await tx.stock.create({
            data: {
              itemId: receiveItem.itemId,
              warehouseId,
              quantityReal: receiveItem.quantityReceived,
              quantityReserved: 0,
              quantityAvailable: receiveItem.quantityReceived,
              averageCost: receiveItem.unitCost,
              lastMovementAt: new Date(),
            },
          })
        }

        // 2d. Create Movement
        const movementNumber = MovementNumberGenerator.generateMovementNumber()

        await tx.movement.create({
          data: {
            movementNumber,
            type: 'PURCHASE' as never,
            itemId: receiveItem.itemId,
            warehouseToId: warehouseId,
            quantity: receiveItem.quantityReceived,
            unitCost: receiveItem.unitCost,
            totalCost: receiveItem.quantityReceived * receiveItem.unitCost,
            reference: entryNoteNumber,
            purchaseOrderId: poId,
            entryNoteId: entryNote.id,
            notes: `Recepción ${entryNoteNumber} — OC ${po.orderNumber}`,
            createdBy: data.receivedBy ?? userId ?? null,
          },
        })
      }

      // 3. Determine new PO status
      const updatedItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: poId },
      })
      const allReceived = updatedItems.every((i) => i.quantityPending <= 0)
      const someReceived = updatedItems.some((i) => i.quantityReceived > 0)
      const newStatus = allReceived
        ? PurchaseOrderStatus.COMPLETED
        : someReceived
          ? PurchaseOrderStatus.PARTIAL
          : po.status

      await tx.purchaseOrder.update({
        where: { id: poId },
        data: { status: newStatus },
      })

      // 4. Return updated PO
      return tx.purchaseOrder.findUnique({
        where: { id: poId },
        include: {
          ...PO_INCLUDE,
          entryNotes: { include: { items: true } },
        },
      })
    })

    if (!result) throw new Error('Error al procesar la recepción')

    logger.info(`Recepción completada para orden ${poId}`, {
      entryNoteNumber,
      itemsReceived: data.items.length,
      newStatus: result.status,
      empresaId,
      userId,
    })

    return enrichWithQuantityPending(
      result as unknown as Record<string, unknown>
    ) as unknown as IPurchaseOrderWithRelations
  }
}

export default new PurchaseOrderService()
