// backend/src/features/inventory/purchaseOrders/purchaseOrders.service.ts

import prisma from '../../../services/prisma.service'
import { logger } from '../../../shared/utils/logger'
import { PaginationHelper } from '../../../shared/utils/pagination'
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from '../../../shared/utils/apiError'
import {
  IPurchaseOrder,
  IPurchaseOrderWithRelations,
  IPurchaseOrderItem,
  ICreatePurchaseOrderInput,
  IUpdatePurchaseOrderInput,
  IPurchaseOrderFilters,
  ICreatePurchaseOrderItemInput,
  ICreatePurchaseOrderWithItemsInput,
  IReceiveOrderInput,
  PurchaseOrderStatus,
} from './purchaseOrders.interface'
import { INVENTORY_MESSAGES } from '../shared/constants/messages'

class PurchaseOrderService {
  /**
   * Helper function to enrich purchase order(s) with calculated quantityPending
   */
  private enrichWithQuantityPending(po: any | any[]): any | any[] {
    if (Array.isArray(po)) {
      return po.map((item) => this.enrichWithQuantityPending(item))
    }

    if (!po) return po

    if (po.items && Array.isArray(po.items)) {
      po.items = po.items.map((item: any) => ({
        ...item,
        quantityPending: item.quantityOrdered - item.quantityReceived,
      }))
    }

    return po
  }

  /**
   * Crear orden de compra
   */
  async create(
    data: ICreatePurchaseOrderInput,
    userId?: string
  ): Promise<IPurchaseOrderWithRelations> {
    try {
      // Validar que el proveedor existe
      const supplier = await prisma.supplier.findUnique({
        where: { id: data.supplierId },
      })

      if (!supplier) {
        throw new NotFoundError('Proveedor no encontrado')
      }

      // Validar que el almacén existe
      const warehouse = await prisma.warehouse.findUnique({
        where: { id: data.warehouseId },
      })

      if (!warehouse) {
        throw new NotFoundError(INVENTORY_MESSAGES.warehouse.notFound)
      }

      // Generar número de orden único
      const poCount = await prisma.purchaseOrder.count()
      const orderNumber = `PO-${new Date().getFullYear()}-${String(poCount + 1).padStart(5, '0')}`

      // Crear orden de compra
      const po = await prisma.purchaseOrder.create({
        data: {
          orderNumber,
          supplierId: data.supplierId,
          warehouseId: data.warehouseId,
          status: PurchaseOrderStatus.DRAFT,
          subtotal: 0,
          tax: 0,
          total: 0,
          notes: data.notes ?? null,
          expectedDate: data.expectedDate ?? null,
          createdBy: userId || data.createdBy || '',
        },
        include: {
          supplier: true,
          warehouse: true,
          items: { include: { item: true } },
        },
      })

      logger.info(`Orden de compra creada: ${po.id}`, {
        orderNumber: po.orderNumber,
        supplierId: po.supplierId,
      })

      return this.enrichWithQuantityPending(
        po
      ) as unknown as IPurchaseOrderWithRelations
    } catch (error) {
      logger.error('Error al crear orden de compra', { error, data })
      throw error
    }
  }

  /**
   * Obtener orden de compra por ID
   */
  async findById(
    id: string,
    includeItems: boolean = true
  ): Promise<IPurchaseOrderWithRelations> {
    try {
      const include: any = {
        supplier: true,
        warehouse: true,
      }
      if (includeItems) include.items = { include: { item: true } }

      const po = await prisma.purchaseOrder.findUnique({
        where: { id },
        include,
      })

      if (!po) {
        throw new NotFoundError('Orden de compra no encontrada')
      }

      return this.enrichWithQuantityPending(
        po
      ) as unknown as IPurchaseOrderWithRelations
    } catch (error) {
      logger.error('Error al obtener orden de compra', { error, id })
      throw error
    }
  }

  /**
   * Obtener todas las órdenes de compra con filtros
   */
  async findAll(
    filters: IPurchaseOrderFilters = {},
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'orderDate',
    sortOrder: 'asc' | 'desc' = 'desc',
    prismaClient?: any
  ): Promise<{
    items: IPurchaseOrderWithRelations[]
    total: number
    page: number
    limit: number
  }> {
    try {
      const db = prismaClient || prisma
      const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

      const where: any = {}
      if (filters.status) where.status = filters.status
      if (filters.supplierId) where.supplierId = filters.supplierId
      if (filters.warehouseId) where.warehouseId = filters.warehouseId
      if (filters.createdBy) where.createdBy = filters.createdBy

      if (filters.orderFrom || filters.orderTo) {
        where.orderDate = {}
        if (filters.orderFrom) where.orderDate.gte = filters.orderFrom
        if (filters.orderTo) where.orderDate.lte = filters.orderTo
      }

      const [total, pos] = await Promise.all([
        db.purchaseOrder.count({ where }),
        db.purchaseOrder.findMany({
          where,
          include: {
            supplier: true,
            warehouse: true,
            items: { include: { item: true } },
          },
          skip,
          take,
          orderBy: { [sortBy]: sortOrder },
        }),
      ])

      return {
        items: this.enrichWithQuantityPending(
          pos
        ) as unknown as IPurchaseOrderWithRelations[],
        total,
        page,
        limit,
      }
    } catch (error) {
      logger.error('Error al obtener órdenes de compra', { error, filters })
      throw error
    }
  }

  /**
   * Obtener órdenes de compra por proveedor
   */
  async findBySupplier(
    supplierId: string,
    limit: number = 20
  ): Promise<IPurchaseOrderWithRelations[]> {
    try {
      const pos = await prisma.purchaseOrder.findMany({
        where: { supplierId },
        include: {
          supplier: true,
          warehouse: true,
          items: { include: { item: true } },
        },
        take: limit,
        orderBy: { orderDate: 'desc' },
      })

      return this.enrichWithQuantityPending(
        pos
      ) as unknown as IPurchaseOrderWithRelations[]
    } catch (error) {
      logger.error('Error al obtener órdenes del proveedor', {
        error,
        supplierId,
      })
      throw error
    }
  }

  /**
   * Actualizar orden de compra
   */
  async update(
    id: string,
    data: IUpdatePurchaseOrderInput
  ): Promise<IPurchaseOrderWithRelations> {
    try {
      const po = await prisma.purchaseOrder.findUnique({
        where: { id },
      })

      if (!po) {
        throw new NotFoundError('Orden de compra no encontrada')
      }

      // No permitir cambio de estado a CANCELLED si ya está completada
      if (
        data.status === PurchaseOrderStatus.CANCELLED &&
        po.status === PurchaseOrderStatus.COMPLETED
      ) {
        throw new BadRequestError('No se puede cancelar una orden completada')
      }

      // Construir objeto de actualización con solo campos definidos
      const updateData: any = {}
      if (data.status !== undefined) updateData.status = data.status
      if (data.notes !== undefined) updateData.notes = data.notes ?? null
      if (data.expectedDate !== undefined)
        updateData.expectedDate = data.expectedDate ?? null

      const updated = await prisma.purchaseOrder.update({
        where: { id },
        data: updateData,
        include: {
          supplier: true,
          warehouse: true,
          items: { include: { item: true } },
        },
      })

      logger.info(`Orden de compra actualizada: ${id}`, { data })

      return this.enrichWithQuantityPending(
        updated
      ) as unknown as IPurchaseOrderWithRelations
    } catch (error) {
      logger.error('Error al actualizar orden de compra', { error, id, data })
      throw error
    }
  }

  /**
   * Aprobar orden de compra
   */
  async approve(
    id: string,
    approvedBy: string
  ): Promise<IPurchaseOrderWithRelations> {
    try {
      const po = await prisma.purchaseOrder.findUnique({
        where: { id },
      })

      if (!po) {
        throw new NotFoundError('Orden de compra no encontrada')
      }

      if (po.status !== PurchaseOrderStatus.DRAFT) {
        throw new BadRequestError(
          `No se puede aprobar una orden con estado ${po.status}`
        )
      }

      // Validar que tenga al menos un item
      const itemCount = await prisma.purchaseOrderItem.count({
        where: { purchaseOrderId: id },
      })

      if (itemCount === 0) {
        throw new BadRequestError(
          'La orden de compra debe tener al menos un item'
        )
      }

      const updated = await prisma.purchaseOrder.update({
        where: { id },
        data: {
          status: PurchaseOrderStatus.SENT,
          approvedBy,
          approvedAt: new Date(),
        },
        include: {
          supplier: true,
          warehouse: true,
          items: { include: { item: true } },
        },
      })

      logger.info(`Orden de compra aprobada: ${id}`, { approvedBy })

      return this.enrichWithQuantityPending(
        updated
      ) as unknown as IPurchaseOrderWithRelations
    } catch (error) {
      logger.error('Error al aprobar orden de compra', { error, id })
      throw error
    }
  }

  /**
   * Cancelar orden de compra
   */
  async cancel(id: string): Promise<IPurchaseOrderWithRelations> {
    try {
      const po = await prisma.purchaseOrder.findUnique({
        where: { id },
      })

      if (!po) {
        throw new NotFoundError('Orden de compra no encontrada')
      }

      if (po.status === PurchaseOrderStatus.COMPLETED) {
        throw new BadRequestError('No se puede cancelar una orden completada')
      }

      const updated = await prisma.purchaseOrder.update({
        where: { id },
        data: { status: PurchaseOrderStatus.CANCELLED },
        include: {
          supplier: true,
          warehouse: true,
          items: { include: { item: true } },
        },
      })

      logger.info(`Orden de compra cancelada: ${id}`)

      return this.enrichWithQuantityPending(
        updated
      ) as unknown as IPurchaseOrderWithRelations
    } catch (error) {
      logger.error('Error al cancelar orden de compra', { error, id })
      throw error
    }
  }

  /**
   * Agregar item a la orden de compra
   */
  async addItem(
    poId: string,
    data: ICreatePurchaseOrderItemInput
  ): Promise<IPurchaseOrderItem> {
    try {
      const po = await prisma.purchaseOrder.findUnique({
        where: { id: poId },
      })

      if (!po) {
        throw new NotFoundError('Orden de compra no encontrada')
      }

      if (po.status !== PurchaseOrderStatus.DRAFT) {
        throw new BadRequestError(
          'Solo se pueden agregar items a órdenes en estado DRAFT'
        )
      }

      // Validar que el item existe
      const item = await prisma.item.findUnique({
        where: { id: data.itemId },
      })

      if (!item) {
        throw new NotFoundError(INVENTORY_MESSAGES.item.notFound)
      }

      const subtotal = data.quantityOrdered * data.unitCost

      // Crear item en la orden
      const poItem = await prisma.purchaseOrderItem.create({
        data: {
          purchaseOrderId: poId,
          itemId: data.itemId,
          quantityOrdered: data.quantityOrdered,
          quantityReceived: 0,
          quantityPending: data.quantityOrdered,
          unitCost: data.unitCost,
          subtotal,
        },
      })

      // Actualizar totales de la orden
      const items = await prisma.purchaseOrderItem.findMany({
        where: { purchaseOrderId: poId },
      })

      const newSubtotal = items.reduce(
        (sum: number, item: any) => sum + parseFloat(String(item.subtotal)),
        0
      )
      const newTotal = newSubtotal + parseFloat(String(po.tax || 0))

      await prisma.purchaseOrder.update({
        where: { id: poId },
        data: {
          subtotal: newSubtotal,
          total: newTotal,
        },
      })

      logger.info(`Item agregado a orden de compra: ${poId}`, {
        itemId: data.itemId,
        quantity: data.quantityOrdered,
      })

      return poItem as unknown as IPurchaseOrderItem
    } catch (error) {
      logger.error('Error al agregar item a orden de compra', {
        error,
        poId,
        data,
      })
      throw error
    }
  }

  /**
   * Obtener items de una orden de compra
   */
  async getItems(poId: string): Promise<IPurchaseOrderItem[]> {
    try {
      const items = await prisma.purchaseOrderItem.findMany({
        where: { purchaseOrderId: poId },
      })

      return items as unknown as IPurchaseOrderItem[]
    } catch (error) {
      logger.error('Error al obtener items de orden de compra', { error, poId })
      throw error
    }
  }

  /**
   * Eliminar orden de compra (solo si está en DRAFT)
   */
  async delete(id: string): Promise<any> {
    try {
      const po = await prisma.purchaseOrder.findUnique({
        where: { id },
      })

      if (!po) {
        throw new NotFoundError('Orden de compra no encontrada')
      }

      if (po.status !== PurchaseOrderStatus.DRAFT) {
        throw new BadRequestError(
          'Solo se pueden eliminar órdenes en estado DRAFT'
        )
      }

      // Eliminar items primero
      await prisma.purchaseOrderItem.deleteMany({
        where: { purchaseOrderId: id },
      })

      await prisma.purchaseOrder.delete({ where: { id } })

      logger.info(`Orden de compra eliminada: ${id}`)

      return { success: true, id }
    } catch (error) {
      logger.error('Error al eliminar orden de compra', { error, id })
      throw error
    }
  }

  /**
   * Crear orden de compra CON items en una sola transacción
   */
  async createWithItems(
    data: ICreatePurchaseOrderWithItemsInput,
    userId?: string
  ): Promise<IPurchaseOrderWithRelations> {
    try {
      // Validar proveedor
      const supplier = await prisma.supplier.findUnique({
        where: { id: data.supplierId },
      })
      if (!supplier) throw new NotFoundError('Proveedor no encontrado')

      // Validar almacén
      const warehouse = await prisma.warehouse.findUnique({
        where: { id: data.warehouseId },
      })
      if (!warehouse)
        throw new NotFoundError(INVENTORY_MESSAGES.warehouse.notFound)

      // Validar que todos los items existen
      const itemIds = data.items.map((i) => i.itemId)
      const existingItems = await prisma.item.findMany({
        where: { id: { in: itemIds } },
        select: { id: true },
      })
      if (existingItems.length !== itemIds.length) {
        throw new BadRequestError('Uno o más artículos no existen')
      }

      // Generar número de orden
      const poCount = await prisma.purchaseOrder.count()
      const orderNumber = `PO-${new Date().getFullYear()}-${String(poCount + 1).padStart(5, '0')}`

      // Calcular totales
      const subtotal = data.items.reduce(
        (sum, item) => sum + item.quantityOrdered * item.unitCost,
        0
      )

      // Crear PO + items en transacción
      const po = await prisma.$transaction(async (tx) => {
        const createdPO = await tx.purchaseOrder.create({
          data: {
            orderNumber,
            supplierId: data.supplierId,
            warehouseId: data.warehouseId,
            status: PurchaseOrderStatus.DRAFT,
            subtotal,
            tax: 0,
            total: subtotal,
            notes: data.notes ?? null,
            expectedDate: data.expectedDate ?? null,
            createdBy: userId || data.createdBy || '',
          },
        })

        // Crear items
        for (const item of data.items) {
          const itemSubtotal = item.quantityOrdered * item.unitCost
          await tx.purchaseOrderItem.create({
            data: {
              purchaseOrderId: createdPO.id,
              itemId: item.itemId,
              quantityOrdered: item.quantityOrdered,
              quantityReceived: 0,
              quantityPending: item.quantityOrdered,
              unitCost: item.unitCost,
              subtotal: itemSubtotal,
            },
          })
        }

        // Retornar PO con relaciones
        return tx.purchaseOrder.findUnique({
          where: { id: createdPO.id },
          include: {
            supplier: true,
            warehouse: true,
            items: { include: { item: true } },
          },
        })
      })

      if (!po) throw new Error('Error al crear la orden de compra')

      logger.info(
        `Orden de compra creada con ${data.items.length} items: ${po.id}`,
        {
          orderNumber: po.orderNumber,
          supplierId: po.supplierId,
          itemCount: data.items.length,
        }
      )

      return this.enrichWithQuantityPending(
        po
      ) as unknown as IPurchaseOrderWithRelations
    } catch (error) {
      logger.error('Error al crear orden de compra con items', { error, data })
      throw error
    }
  }

  /**
   * Recepcionar mercancía de una orden de compra
   * Crea EntryNote + EntryNoteItems, actualiza PurchaseOrderItem quantities,
   * actualiza Stock, crea Movements — todo en una transacción atómica
   */
  async receiveOrder(
    poId: string,
    data: IReceiveOrderInput,
    userId?: string
  ): Promise<IPurchaseOrderWithRelations> {
    try {
      // Obtener PO con items
      const po = await prisma.purchaseOrder.findUnique({
        where: { id: poId },
        include: { items: true, warehouse: true },
      })

      if (!po) throw new NotFoundError('Orden de compra no encontrada')

      if (
        po.status === PurchaseOrderStatus.COMPLETED ||
        po.status === PurchaseOrderStatus.CANCELLED ||
        po.status === PurchaseOrderStatus.DRAFT
      ) {
        throw new BadRequestError(
          `No se puede recepcionar una orden con estado ${po.status}. La orden debe estar en estado SENT o PARTIAL.`
        )
      }

      const warehouseId = data.warehouseId || po.warehouseId

      // Validar que el almacén existe
      const warehouse = await prisma.warehouse.findUnique({
        where: { id: warehouseId },
      })
      if (!warehouse)
        throw new NotFoundError(INVENTORY_MESSAGES.warehouse.notFound)

      // Validar cantidades vs pendientes
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

      // Generar número de nota de entrada
      const entryNoteCount = await prisma.entryNote.count()
      const entryNoteNumber = `EN-${new Date().getFullYear()}-${String(entryNoteCount + 1).padStart(5, '0')}`

      // Ejecutar todo en transacción atómica
      const result = await prisma.$transaction(async (tx) => {
        // 1. Crear EntryNote de tipo PURCHASE con estado COMPLETED
        const entryNote = await tx.entryNote.create({
          data: {
            entryNoteNumber,
            type: 'PURCHASE',
            status: 'COMPLETED',
            purchaseOrderId: poId,
            warehouseId,
            notes: data.notes ?? null,
            receivedBy: data.receivedBy || userId || null,
            receivedAt: new Date(),
            verifiedAt: new Date(),
          },
        })

        // 2. Para cada item recibido
        for (const receiveItem of data.items) {
          const poItem = po.items.find((i) => i.itemId === receiveItem.itemId)!

          // 2a. Crear EntryNoteItem
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

          // 2b. Actualizar PurchaseOrderItem
          const newQuantityReceived =
            poItem.quantityReceived + receiveItem.quantityReceived
          const newQuantityPending =
            poItem.quantityOrdered - newQuantityReceived

          await tx.purchaseOrderItem.update({
            where: { id: poItem.id },
            data: {
              quantityReceived: newQuantityReceived,
              quantityPending: Math.max(0, newQuantityPending),
            },
          })

          // 2c. Upsert Stock (crear o incrementar)
          const existingStock = await tx.stock.findUnique({
            where: {
              itemId_warehouseId: {
                itemId: receiveItem.itemId,
                warehouseId,
              },
            },
          })

          if (existingStock) {
            const newReal =
              existingStock.quantityReal + receiveItem.quantityReceived
            const newAvailable =
              existingStock.quantityAvailable + receiveItem.quantityReceived

            // Calcular costo promedio ponderado
            const existingTotal =
              existingStock.quantityReal *
              parseFloat(String(existingStock.averageCost))
            const newTotal = receiveItem.quantityReceived * receiveItem.unitCost
            const newAverageCost =
              newReal > 0
                ? (existingTotal + newTotal) / newReal
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

          // 2d. Crear Movement de tipo PURCHASE
          const movementCount = await tx.movement.count()
          const movementNumber = `MOV-${new Date().getFullYear()}-${String(movementCount + 1).padStart(5, '0')}`

          await tx.movement.create({
            data: {
              movementNumber,
              type: 'PURCHASE',
              itemId: receiveItem.itemId,
              warehouseToId: warehouseId,
              quantity: receiveItem.quantityReceived,
              unitCost: receiveItem.unitCost,
              totalCost: receiveItem.quantityReceived * receiveItem.unitCost,
              reference: entryNoteNumber,
              purchaseOrderId: poId,
              entryNoteId: entryNote.id,
              notes: `Nota de entrada ${entryNoteNumber} de orden ${po.orderNumber}`,
              createdBy: data.receivedBy || userId || null,
            },
          })
        }

        // 3. Determinar nuevo estado de la PO
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

        // 4. Retornar PO actualizada
        return tx.purchaseOrder.findUnique({
          where: { id: poId },
          include: {
            supplier: true,
            warehouse: true,
            items: { include: { item: true } },
            entryNotes: { include: { items: true } },
          },
        })
      })

      if (!result) throw new Error('Error al procesar la recepción')

      logger.info(`Recepción completada para orden ${poId}`, {
        entryNoteNumber,
        itemsReceived: data.items.length,
        newStatus: result.status,
      })

      return this.enrichWithQuantityPending(
        result
      ) as unknown as IPurchaseOrderWithRelations
    } catch (error) {
      logger.error('Error al recepcionar orden de compra', {
        error,
        poId,
        data,
      })
      throw error
    }
  }
}

export default new PurchaseOrderService()
