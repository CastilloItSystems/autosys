// backend/src/features/sales/preInvoices/preInvoices.service.ts

import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import { logger } from '../../../shared/utils/logger.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import {
  NotFoundError,
  BadRequestError,
} from '../../../shared/utils/apiError.js'
import { domainEventBus } from '../../../shared/events/domain-event-bus.js'
import { toDomainEvent } from '../../../shared/events/domain-events.js'
import {
  IPreInvoice,
  PreInvoiceStatus,
  IPreInvoiceFilters,
  IPreInvoiceSalesStockDiagnosis,
  IPreInvoiceStockShortage,
  ISalesWarehouseRef,
  ICreateSuggestedTransfersResult,
} from './preInvoices.interface.js'
import transfersService from '../../inventory/transfers/transfers.service.js'
import { resolveUserNames } from '../shared/userNameResolver.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PI_INCLUDE = {
  items: {
    include: {
      item: { select: { id: true, sku: true, name: true } },
    },
  },
  order: { select: { id: true, orderNumber: true, status: true, approvedBy: true, approvedAt: true } },
  serviceOrder: { select: { id: true, folio: true, status: true } },
  consolidatedServiceOrders: {
    select: { id: true, folio: true, status: true },
  },
  customer: true,
  warehouse: { select: { id: true, name: true, code: true } },
} as const

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class PreInvoicesService {
  private async resolveSalesWarehouse(
    empresaId: string,
    fallbackWarehouseId: string | null | undefined,
    db: PrismaClientType
  ): Promise<ISalesWarehouseRef | null> {
    const defaultWarehouse = await (db as PrismaClient).warehouse.findFirst({
      where: { empresaId, isActive: true, isSalesDefault: true },
      select: { id: true, code: true, name: true },
    })

    if (defaultWarehouse) return defaultWarehouse

    if (!fallbackWarehouseId) return null

    const fallbackWarehouse = await (db as PrismaClient).warehouse.findFirst({
      where: { id: fallbackWarehouseId, empresaId, isActive: true },
      select: { id: true, code: true, name: true },
    })

    return fallbackWarehouse ?? null
  }

  async getSalesStockDiagnosis(
    preInvoiceId: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IPreInvoiceSalesStockDiagnosis> {
    const preInvoice = await (db as PrismaClient).preInvoice.findFirst({
      where: { id: preInvoiceId, empresaId },
      include: {
        items: {
          include: {
            item: {
              select: { id: true, sku: true, name: true },
            },
          },
        },
        warehouse: { select: { id: true, code: true, name: true } },
      },
    })

    if (!preInvoice) throw new NotFoundError('Pre-factura no encontrada')

    const isWorkshopPreInvoice =
      Boolean((preInvoice as any).serviceOrderId) || !(preInvoice as any).warehouseId

    if (isWorkshopPreInvoice) {
      return {
        preInvoiceId: preInvoice.id,
        preInvoiceNumber: preInvoice.preInvoiceNumber,
        isWorkshopPreInvoice: true,
        salesWarehouse: null,
        hasShortages: false,
        shortages: [],
      }
    }

    const salesWarehouse = await this.resolveSalesWarehouse(
      empresaId,
      preInvoice.warehouseId,
      db
    )

    if (!salesWarehouse) {
      throw new BadRequestError(
        'No hay un almacén de venta activo configurado para esta empresa.',
        [
          {
            code: 'SALES_WAREHOUSE_NOT_CONFIGURED',
            preInvoiceId: preInvoice.id,
          } as any,
        ]
      )
    }

    const requiredByItem = new Map<
      string,
      { required: number; itemSku: string; itemName: string }
    >()

    for (const row of preInvoice.items as any[]) {
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
        preInvoiceId: preInvoice.id,
        preInvoiceNumber: preInvoice.preInvoiceNumber,
        isWorkshopPreInvoice: false,
        salesWarehouse,
        hasShortages: false,
        shortages: [],
      }
    }

    const [salesWarehouseStocks, originStocks] = await Promise.all([
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

    const shortages: IPreInvoiceStockShortage[] = []

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
      })
    }

    return {
      preInvoiceId: preInvoice.id,
      preInvoiceNumber: preInvoice.preInvoiceNumber,
      isWorkshopPreInvoice: false,
      salesWarehouse,
      hasShortages: shortages.length > 0,
      shortages,
    }
  }

  async assertSalesWarehouseStockAvailable(
    preInvoiceId: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IPreInvoiceSalesStockDiagnosis> {
    const diagnosis = await this.getSalesStockDiagnosis(preInvoiceId, empresaId, db)

    if (!diagnosis.hasShortages) return diagnosis

    throw new BadRequestError(
      'No hay stock suficiente en el almacén de venta para completar esta venta.',
      [
        {
          code: 'SALES_STOCK_SHORTAGE',
          ...diagnosis,
        } as any,
      ]
    )
  }

  async createSuggestedTransfers(
    preInvoiceId: string,
    empresaId: string,
    userId: string,
    db: PrismaClientType
  ): Promise<ICreateSuggestedTransfersResult> {
    const diagnosis = await this.getSalesStockDiagnosis(preInvoiceId, empresaId, db)

    if (diagnosis.isWorkshopPreInvoice) {
      throw new BadRequestError(
        'La pre-factura de taller no requiere transferencias de inventario.'
      )
    }

    if (!diagnosis.salesWarehouse) {
      throw new BadRequestError(
        'No hay un almacén de venta activo configurado para esta empresa.'
      )
    }

    if (!diagnosis.hasShortages) {
      throw new BadRequestError(
        'No hay faltantes en el almacén de venta para esta pre-factura.'
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
            code: 'SALES_TRANSFER_SUGGESTION_EMPTY',
            ...diagnosis,
          } as any,
        ]
      )
    }

    const preInvoice = await (db as PrismaClient).preInvoice.findFirst({
      where: { id: preInvoiceId, empresaId },
      select: { id: true, preInvoiceNumber: true },
    })
    if (!preInvoice) throw new NotFoundError('Pre-factura no encontrada')

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
            toWarehouseId: diagnosis.salesWarehouse!.id,
            preInvoiceId,
            items,
            notes: `Reabastecimiento sugerido para ${preInvoice.preInvoiceNumber}`,
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
          toWarehouseId: diagnosis.salesWarehouse!.id,
          status: String(transfer.status),
          quantity: transfer.quantity,
        })
      }

      return created
    })

    logger.info('Transferencias sugeridas generadas para pre-factura', {
      empresaId,
      preInvoiceId,
      transferCount: createdTransfers.length,
    })

    return {
      preInvoiceId,
      preInvoiceNumber: preInvoice.preInvoiceNumber,
      salesWarehouse: diagnosis.salesWarehouse,
      createdTransfers,
      shortages: diagnosis.shortages,
    }
  }

  // -------------------------------------------------------------------------
  // READ
  // -------------------------------------------------------------------------

  async findById(
    id: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IPreInvoice> {
    const pi = await (db as PrismaClient).preInvoice.findFirst({
      where: { id, empresaId },
      include: PI_INCLUDE,
    })
    if (!pi) throw new NotFoundError('Pre-factura no encontrada')
    const names = await resolveUserNames(db, [(pi as any).preparedBy, (pi as any).order?.approvedBy])
    const result = pi as any
    result.preparedByName = names.get(result.preparedBy) ?? null
    if (result.order) result.order.approvedByName = names.get(result.order.approvedBy) ?? null
    return result as unknown as IPreInvoice
  }

  async findAll(
    filters: IPreInvoiceFilters,
    page: number,
    limit: number,
    empresaId: string,
    db: PrismaClientType,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: IPreInvoice[]; total: number }> {
    const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

    const where: Prisma.PreInvoiceWhereInput = { empresaId }
    const andConditions: Prisma.PreInvoiceWhereInput[] = []

    if (filters.status) where.status = filters.status as any
    if (filters.customerId) where.customerId = filters.customerId
    if (filters.orderId) where.orderId = filters.orderId
    if (filters.serviceOrderId) where.serviceOrderId = filters.serviceOrderId

    if (filters.hasServiceOrder === true) {
      andConditions.push({
        OR: [
          { serviceOrderId: { not: null } },
          { consolidatedServiceOrders: { some: {} } },
        ],
      })
    } else if (filters.hasServiceOrder === false) {
      andConditions.push({
        serviceOrderId: null,
        consolidatedServiceOrders: { none: {} },
      })
    }

    if (filters.origin === 'WORKSHOP') {
      andConditions.push({
        OR: [
          { serviceOrderId: { not: null } },
          { consolidatedServiceOrders: { some: {} } },
        ],
      })
    } else if (filters.origin === 'ORDER') {
      andConditions.push({ orderId: { not: null } })
    }

    if (filters.search) {
      const search = filters.search.trim()
      andConditions.push({
        OR: [
          { preInvoiceNumber: { contains: search, mode: 'insensitive' } },
          { customer: { name: { contains: search, mode: 'insensitive' } } },
          { order: { orderNumber: { contains: search, mode: 'insensitive' } } },
          { serviceOrder: { folio: { contains: search, mode: 'insensitive' } } },
          {
            consolidatedServiceOrders: {
              some: { folio: { contains: search, mode: 'insensitive' } },
            },
          },
        ],
      })
    }

    if (andConditions.length > 0) {
      where.AND = andConditions
    }

    const validSortFields = new Set([
      'createdAt',
      'preInvoiceNumber',
      'status',
      'total',
    ])
    const safeSortBy = validSortFields.has(sortBy) ? sortBy : 'createdAt'

    const [data, total] = await Promise.all([
      (db as PrismaClient).preInvoice.findMany({
        where,
        include: PI_INCLUDE,
        orderBy: { [safeSortBy]: sortOrder },
        skip,
        take,
      }),
      (db as PrismaClient).preInvoice.count({ where }),
    ])

    const allUserIds = (data as any[]).flatMap((p) => [p.preparedBy, p.order?.approvedBy])
    const names = await resolveUserNames(db, allUserIds)
    const enriched = (data as any[]).map((p) => ({
      ...p,
      preparedByName: names.get(p.preparedBy) ?? null,
      order: p.order
        ? { ...p.order, approvedByName: names.get(p.order.approvedBy) ?? null }
        : p.order,
    }))

    return { data: enriched as unknown as IPreInvoice[], total }
  }

  // -------------------------------------------------------------------------
  // STATUS TRANSITIONS
  // -------------------------------------------------------------------------

  /**
   * PENDING_PREPARATION → IN_PREPARATION
   */
  async startPreparation(
    id: string,
    empresaId: string,
    preparedBy: string,
    db: PrismaClientType
  ): Promise<IPreInvoice> {
    const pi = await (db as PrismaClient).preInvoice.findFirst({
      where: { id, empresaId },
    })
    if (!pi) throw new NotFoundError('Pre-factura no encontrada')

    if (pi.status !== PreInvoiceStatus.PENDING_PREPARATION) {
      throw new BadRequestError(
        `No se puede iniciar preparación desde estado ${pi.status}`
      )
    }

    const updated = await (db as PrismaClient).preInvoice.update({
      where: { id },
      data: {
        status: PreInvoiceStatus.IN_PREPARATION,
        preparedBy,
      },
      include: PI_INCLUDE,
    })

    logger.info(`Pre-factura en preparación: ${id}`, { empresaId })
    return updated as unknown as IPreInvoice
  }

  /**
   * IN_PREPARATION → READY_FOR_PAYMENT
   */
  async markReady(
    id: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IPreInvoice> {
    const pi = await (db as PrismaClient).preInvoice.findFirst({
      where: { id, empresaId },
    })
    if (!pi) throw new NotFoundError('Pre-factura no encontrada')

    if (pi.status !== PreInvoiceStatus.IN_PREPARATION) {
      throw new BadRequestError(
        `No se puede marcar como lista desde estado ${pi.status}`
      )
    }

    const updated = await (db as PrismaClient).preInvoice.update({
      where: { id },
      data: {
        status: PreInvoiceStatus.READY_FOR_PAYMENT,
        preparedAt: new Date(),
      },
      include: PI_INCLUDE,
    })

    logger.info(`Pre-factura lista para pago: ${id}`, { empresaId })
    return updated as unknown as IPreInvoice
  }

  /**
   * READY_FOR_PAYMENT → PAID
   * This is the BIG one — generates Invoice + ExitNote + stock deduction
   */
  async markPaid(
    id: string,
    empresaId: string,
    userId: string,
    db: PrismaClientType
  ): Promise<IPreInvoice> {
    const pi = await (db as PrismaClient).preInvoice.findFirst({
      where: { id, empresaId },
      include: { items: true, order: true, warehouse: true },
    })
    if (!pi) throw new NotFoundError('Pre-factura no encontrada')

    if (pi.status !== PreInvoiceStatus.READY_FOR_PAYMENT) {
      throw new BadRequestError(
        `No se puede marcar como pagada desde estado ${pi.status}`
      )
    }

    // For now, just mark as PAID
    // TODO: In future phases, this will generate:
    //   1. Invoice (factura fiscal con numeración SENIAT)
    //   2. ExitNote tipo SALE (despacho que descuenta stock)
    //   3. Movement records
    //   4. Stock deduction

    const updated = await (db as PrismaClient).preInvoice.update({
      where: { id },
      data: {
        status: PreInvoiceStatus.PAID,
        paidAt: new Date(),
      },
      include: PI_INCLUDE,
    })

    logger.info(`Pre-factura pagada: ${id}`, { empresaId, userId })
    return updated as unknown as IPreInvoice
  }

  /**
   * Cancel — from any status except PAID
   */
  async cancel(
    id: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IPreInvoice> {
    const pi = await (db as PrismaClient).preInvoice.findFirst({
      where: { id, empresaId },
    })
    if (!pi) throw new NotFoundError('Pre-factura no encontrada')

    if (pi.status === PreInvoiceStatus.PAID) {
      throw new BadRequestError(
        'No se puede cancelar una pre-factura pagada'
      )
    }
    if (pi.status === PreInvoiceStatus.CANCELLED) {
      throw new BadRequestError('La pre-factura ya está cancelada')
    }

    const updated = await (db as PrismaClient).preInvoice.update({
      where: { id },
      data: { status: PreInvoiceStatus.CANCELLED },
      include: PI_INCLUDE,
    })

    logger.info(`Pre-factura cancelada: ${id}`, { empresaId })

    try {
      await domainEventBus.publish(
        toDomainEvent({
          empresaId,
          eventCode: 'sales.pre_invoice.cancelled',
          module: 'sales',
          title: `Pre-factura ${updated.preInvoiceNumber} cancelada`,
          message: `La pre-factura ${updated.preInvoiceNumber} fue cancelada.`,
          type: 'warning',
          entityType: 'PRE_INVOICE',
          entityId: updated.id,
          priority: 'HIGH',
          severity: 'WARNING',
          link: `/empresa/ventas/prefacturas/${updated.id}`,
          source: 'sales.pre_invoices',
          dedupKey: `sales.pre_invoice.cancelled:${updated.id}`,
          metadata: {
            preInvoiceId: updated.id,
            preInvoiceNumber: updated.preInvoiceNumber,
          },
          createdById: 'SYSTEM',
          createdByName: 'Sistema',
        })
      )
    } catch (publishError) {
      logger.error('Error publicando evento sales.pre_invoice.cancelled', {
        preInvoiceId: updated.id,
        empresaId,
        error: publishError,
      })
    }

    return updated as unknown as IPreInvoice
  }
}

export default new PreInvoicesService()
