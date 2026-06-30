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
import { CreateOrderDTO, UpdateOrderDTO } from './orders.dto.js'
import {
  IOrder,
  OrderStatus,
  OrderCurrency,
  IOrderFilters,
  IOrderSalesStockDiagnosis,
  IOrderSuggestedTransfersResult,
  IOrderSuggestedPurchaseOrdersResult,
  ICreateOrderReplenishmentInput,
  IOrderSuggestedReplenishmentResult,
} from './orders.interface.js'
import { calculateOrderTotals } from '../../inventory/shared/utils/calculateOrderTotals.js'
import { createAuditLog } from '../../../services/audit.service.js'
import { resolveUserNames } from '../shared/userNameResolver.js'
import {
  PrismaClientType,
  MSG,
  ORDER_INCLUDE,
  generateOrderNumber,
  generatePreInvoiceNumber,
  salesOrderAuditMetadata,
} from './orders.shared.js'
import {
  buildSalesStockDiagnosis,
  getSalesStockDiagnosis,
  assertSalesWarehouseStockAvailable,
  createSuggestedTransfers,
  createSuggestedPurchaseOrders,
  createSuggestedReplenishmentPlan,
} from './orders.replenishment.js'

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class OrdersService {
  async getSalesStockDiagnosis(
    id: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IOrderSalesStockDiagnosis> {
    return getSalesStockDiagnosis(id, empresaId, db)
  }

  async assertSalesWarehouseStockAvailable(
    id: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IOrderSalesStockDiagnosis> {
    return assertSalesWarehouseStockAvailable(id, empresaId, db)
  }

  async createSuggestedTransfers(
    id: string,
    empresaId: string,
    userId: string,
    db: PrismaClientType
  ): Promise<IOrderSuggestedTransfersResult> {
    return createSuggestedTransfers(id, empresaId, userId, db)
  }

  async createSuggestedPurchaseOrders(
    id: string,
    empresaId: string,
    userId: string,
    db: PrismaClientType
  ): Promise<IOrderSuggestedPurchaseOrdersResult> {
    return createSuggestedPurchaseOrders(id, empresaId, userId, db)
  }

  async createSuggestedReplenishmentPlan(
    id: string,
    empresaId: string,
    userId: string,
    input: ICreateOrderReplenishmentInput,
    db: PrismaClientType
  ): Promise<IOrderSuggestedReplenishmentResult> {
    return createSuggestedReplenishmentPlan(id, empresaId, userId, input, db)
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
    const names = await resolveUserNames(db, [(order as any).approvedBy, (order as any).createdBy])
    const result = order as any
    result.approvedByName = names.get(result.approvedBy) ?? null
    result.createdByName = names.get(result.createdBy) ?? null
    return result as unknown as IOrder
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

    const allUserIds = (data as any[]).flatMap((o) => [o.approvedBy, o.createdBy])
    const names = await resolveUserNames(db, allUserIds)
    const enriched = (data as any[]).map((o) => ({
      ...o,
      approvedByName: names.get(o.approvedBy) ?? null,
      createdByName: names.get(o.createdBy) ?? null,
    }))

    return { data: enriched as unknown as IOrder[], total }
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

    const salesStockDiagnosis = await buildSalesStockDiagnosis(
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

      await createAuditLog(
        {
          entity: 'Order',
          entityId: id,
          action: 'APPROVE',
          empresaId,
          userId: approvedBy,
          changes: {
            before: { status: order.status },
            after: {
              status: OrderStatus.APPROVED,
              approvedBy,
              approvedAt: approvedOrder.approvedAt?.toISOString() ?? null,
              preInvoiceId: preInvoice.id,
              preInvoiceNumber,
            },
          },
          metadata: {
            ...salesOrderAuditMetadata(order),
            preInvoiceId: preInvoice.id,
            preInvoiceNumber,
            salesWarehouseId: salesStockDiagnosis.salesWarehouse.id,
          },
        },
        tx
      )

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

    const names = await resolveUserNames(db, [approvedBy, (updated as any).createdBy])
    ;(updated as any).approvedByName = names.get(approvedBy) ?? null
    ;(updated as any).createdByName = names.get((updated as any).createdBy) ?? null

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
    userId: string | undefined,
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

    await createAuditLog(
      {
        entity: 'Order',
        entityId: id,
        action: 'CANCEL',
        empresaId,
        userId,
        changes: {
          before: { status: order.status },
          after: { status: OrderStatus.CANCELLED },
        },
        metadata: salesOrderAuditMetadata(order),
      },
      db
    )

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
          createdById: userId ?? 'SYSTEM',
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
