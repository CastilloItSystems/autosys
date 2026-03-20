// backend/src/features/sales/orders/orders.service.ts

import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import { logger } from '../../../shared/utils/logger.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import {
  NotFoundError,
  BadRequestError,
} from '../../../shared/utils/apiError.js'
import { SALES_MESSAGES } from '../shared/constants/messages.js'
import { CreateOrderDTO, UpdateOrderDTO } from './orders.dto.js'
import {
  IOrder,
  OrderStatus,
  OrderCurrency,
  IOrderFilters,
} from './orders.interface.js'
import { calculateOrderTotals } from '../../inventory/shared/utils/calculateOrderTotals.js'

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

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class OrdersService {
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
              //   taxType: item.taxType ?? 'IVA',
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
  // APPROVE
  // -------------------------------------------------------------------------

  async approve(
    id: string,
    empresaId: string,
    approvedBy: string,
    db: PrismaClientType
  ): Promise<IOrder> {
    const order = await (db as PrismaClient).order.findFirst({
      where: { id, empresaId },
      include: { items: true },
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

    const updated = await (db as PrismaClient).order.update({
      where: { id },
      data: {
        status: OrderStatus.APPROVED,
        approvedBy,
        approvedAt: new Date(),
      },
      include: ORDER_INCLUDE,
    })

    logger.info(`Orden aprobada: ${id}`, { approvedBy, empresaId })
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
