// backend/src/features/inventory/receives/receives.service.ts

import prisma from '../../../services/prisma.service'
import { logger } from '../../../shared/utils/logger'
import { PaginationHelper } from '../../../shared/utils/pagination'
import { NotFoundError, BadRequestError } from '../../../shared/utils/ApiError'
import {
  IReceiveWithRelations,
  IReceiveItem,
  ICreateReceiveInput,
  IUpdateReceiveInput,
  IReceiveFilters,
  ICreateReceiveItemInput,
} from './receives.interface'

class ReceiveService {
  /**
   * Crear recepción
   */
  async create(
    data: ICreateReceiveInput,
    userId?: string
  ): Promise<IReceiveWithRelations> {
    try {
      // Validar que la orden de compra existe
      const po = await prisma.purchaseOrder.findUnique({
        where: { id: data.purchaseOrderId },
      })

      if (!po) {
        throw new NotFoundError('Orden de compra no encontrada')
      }

      // Generar número de recepción único
      const receiveCount = await prisma.receive.count()
      const receiveNumber = `REC-${new Date().getFullYear()}-${String(receiveCount + 1).padStart(5, '0')}`

      // Crear recepción
      const receive = await prisma.receive.create({
        data: {
          receiveNumber,
          purchaseOrderId: data.purchaseOrderId,
          warehouseId: data.warehouseId,
          notes: data.notes ?? null,
          receivedBy: data.receivedBy || userId || null,
          receivedAt: new Date(),
        },
        include: {
          purchaseOrder: true,
          items: true,
        },
      })

      logger.info(`Recepción creada: ${receive.id}`, {
        receiveNumber: receive.receiveNumber,
        purchaseOrderId: receive.purchaseOrderId,
      })

      const enriched = await this.enrichReceive(receive)
      return enriched as unknown as IReceiveWithRelations
    } catch (error) {
      logger.error('Error al crear recepción', { error, data })
      throw error
    }
  }

  /**
   * Obtener recepción por ID
   */
  async findById(
    id: string,
    includeItems: boolean = true
  ): Promise<IReceiveWithRelations> {
    try {
      const include: any = {
        purchaseOrder: {
          include: { supplier: true },
        },
      }
      if (includeItems) include.items = true

      const receive = await prisma.receive.findUnique({
        where: { id },
        include,
      })

      if (!receive) {
        throw new NotFoundError('Recepción no encontrada')
      }

      // Enrich with warehouse and item relations (no FK in schema)
      const enriched = await this.enrichReceive(receive)
      return enriched as unknown as IReceiveWithRelations
    } catch (error) {
      logger.error('Error al obtener recepción', { error, id })
      throw error
    }
  }

  /**
   * Obtener todas las recepciones con filtros
   */
  async findAll(
    filters: IReceiveFilters = {},
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'receivedAt',
    sortOrder: 'asc' | 'desc' = 'desc',
    prismaClient?: any
  ): Promise<{
    items: IReceiveWithRelations[]
    total: number
    page: number
    limit: number
  }> {
    try {
      const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

      const where: any = {}
      if (filters.purchaseOrderId)
        where.purchaseOrderId = filters.purchaseOrderId
      if (filters.warehouseId) where.warehouseId = filters.warehouseId
      if (filters.receivedBy) where.receivedBy = filters.receivedBy

      if (filters.receivedFrom || filters.receivedTo) {
        where.receivedAt = {}
        if (filters.receivedFrom) where.receivedAt.gte = filters.receivedFrom
        if (filters.receivedTo) where.receivedAt.lte = filters.receivedTo
      }

      const [total, receives] = await Promise.all([
        prisma.receive.count({ where }),
        prisma.receive.findMany({
          where,
          include: {
            purchaseOrder: {
              include: { supplier: true },
            },
            items: true,
          },
          skip,
          take,
          orderBy: { [sortBy]: sortOrder },
        }),
      ])

      // Enrich all receives with warehouse and item data
      const enriched = await Promise.all(
        receives.map((r) => this.enrichReceive(r))
      )

      return {
        items: enriched as unknown as IReceiveWithRelations[],
        total,
        page,
        limit,
      }
    } catch (error) {
      logger.error('Error al obtener recepciones', { error, filters })
      throw error
    }
  }

  /**
   * Actualizar recepción
   */
  async update(
    id: string,
    data: IUpdateReceiveInput
  ): Promise<IReceiveWithRelations> {
    try {
      const receive = await prisma.receive.findUnique({
        where: { id },
      })

      if (!receive) {
        throw new NotFoundError('Recepción no encontrada')
      }

      const updateData: any = {}
      if (data.notes !== undefined) updateData.notes = data.notes ?? null
      if (data.receivedBy !== undefined)
        updateData.receivedBy = data.receivedBy ?? null

      const updated = await prisma.receive.update({
        where: { id },
        data: updateData,
        include: {
          purchaseOrder: true,
          items: true,
        },
      })

      logger.info(`Recepción actualizada: ${id}`, { data })

      const enriched = await this.enrichReceive(updated)
      return enriched as unknown as IReceiveWithRelations
    } catch (error) {
      logger.error('Error al actualizar recepción', { error, id, data })
      throw error
    }
  }

  /**
   * Agregar item a la recepción
   */
  async addItem(
    receiveId: string,
    data: ICreateReceiveItemInput
  ): Promise<IReceiveItem> {
    try {
      const receive = await prisma.receive.findUnique({
        where: { id: receiveId },
      })

      if (!receive) {
        throw new NotFoundError('Recepción no encontrada')
      }

      // Validar que el item existe
      const item = await prisma.item.findUnique({
        where: { id: data.itemId },
      })

      if (!item) {
        throw new NotFoundError('Item no encontrado')
      }

      // Crear item de recepción
      const receiveItem = await prisma.receiveItem.create({
        data: {
          receiveId,
          itemId: data.itemId,
          quantityReceived: data.quantityReceived,
          unitCost: data.unitCost,
          batchNumber: data.batchNumber ?? null,
          expiryDate: data.expiryDate ?? null,
        },
      })

      logger.info(`Item agregado a recepción: ${receiveId}`, {
        itemId: data.itemId,
        quantity: data.quantityReceived,
      })

      // Convert Decimal to number for response
      const unitCost =
        typeof receiveItem.unitCost === 'number'
          ? receiveItem.unitCost
          : parseFloat(String(receiveItem.unitCost))

      return {
        id: receiveItem.id,
        receiveId: receiveItem.receiveId,
        itemId: receiveItem.itemId,
        quantityReceived: receiveItem.quantityReceived,
        unitCost,
        batchNumber: receiveItem.batchNumber,
        expiryDate: receiveItem.expiryDate,
        createdAt: receiveItem.createdAt,
      }
    } catch (error) {
      logger.error('Error al agregar item a recepción', {
        error,
        receiveId,
        data,
      })
      throw error
    }
  }

  /**
   * Obtener items de una recepción
   */
  async getItems(receiveId: string): Promise<IReceiveItem[]> {
    try {
      const items = await prisma.receiveItem.findMany({
        where: { receiveId },
      })

      // Convert Decimal to number for each item
      return items.map((item) => ({
        id: item.id,
        receiveId: item.receiveId,
        itemId: item.itemId,
        quantityReceived: item.quantityReceived,
        unitCost:
          typeof item.unitCost === 'number'
            ? item.unitCost
            : parseFloat(String(item.unitCost)),
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
        createdAt: item.createdAt,
      }))
    } catch (error) {
      logger.error('Error al obtener items de recepción', { error, receiveId })
      throw error
    }
  }

  /**
   * Eliminar recepción
   */
  async delete(id: string): Promise<any> {
    try {
      const receive = await prisma.receive.findUnique({
        where: { id },
        include: { items: true },
      })

      if (!receive) {
        throw new NotFoundError('Recepción no encontrada')
      }

      // Eliminar items primero
      if (receive.items.length > 0) {
        await prisma.receiveItem.deleteMany({
          where: { receiveId: id },
        })
      }

      await prisma.receive.delete({ where: { id } })

      logger.info(`Recepción eliminada: ${id}`)

      return { success: true, id }
    } catch (error) {
      logger.error('Error al eliminar recepción', { error, id })
      throw error
    }
  }

  /**
   * Enrich a receive with warehouse and item relations
   * (No FK relations in Prisma schema, so we do manual lookups)
   */
  private async enrichReceive(receive: any): Promise<any> {
    try {
      // Lookup warehouse
      let warehouse = null
      if (receive.warehouseId) {
        warehouse = await prisma.warehouse.findUnique({
          where: { id: receive.warehouseId },
          select: { id: true, code: true, name: true, type: true },
        })
      }

      // Lookup items' related Item records in batch
      let enrichedItems = receive.items || []
      if (enrichedItems.length > 0) {
        const itemIds = [
          ...new Set(enrichedItems.map((ri: any) => ri.itemId).filter(Boolean)),
        ]
        const items = await prisma.item.findMany({
          where: { id: { in: itemIds as string[] } },
          select: { id: true, sku: true, name: true },
        })
        const itemMap = new Map(items.map((i) => [i.id, i]))

        enrichedItems = enrichedItems.map((ri: any) => ({
          ...ri,
          item: itemMap.get(ri.itemId) || null,
        }))
      }

      // Lookup receivedBy user name
      let receivedByName: string | null = null
      if (receive.receivedBy) {
        const user = await prisma.user.findUnique({
          where: { id: receive.receivedBy },
          select: { name: true, email: true },
        })
        if (user) {
          receivedByName = user.name || user.email || receive.receivedBy
        }
      }

      return {
        ...receive,
        warehouse,
        items: enrichedItems,
        receivedByName,
      }
    } catch (error) {
      logger.error('Error al enriquecer recepción', {
        error,
        receiveId: receive.id,
      })
      // Return original receive if enrichment fails
      return receive
    }
  }
}

export default new ReceiveService()
