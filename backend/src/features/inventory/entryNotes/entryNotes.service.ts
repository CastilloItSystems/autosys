// backend/src/features/inventory/entryNotes/entryNotes.service.ts

import prisma from '../../../services/prisma.service'
import { logger } from '../../../shared/utils/logger'
import { PaginationHelper } from '../../../shared/utils/pagination'
import { NotFoundError, BadRequestError } from '../../../shared/utils/ApiError'
import { INVENTORY_MESSAGES } from '../shared/constants/messages'
import { MovementNumberGenerator } from '../shared/utils/movementNumberGenerator'
import {
  IEntryNoteWithRelations,
  IEntryNoteItem,
  ICreateEntryNoteInput,
  IUpdateEntryNoteInput,
  IEntryNoteFilters,
  ICreateEntryNoteItemInput,
  IEntryNoteListResult,
  EntryNoteStatus,
} from './entryNotes.interface'

const ENTRY_NOTE_INCLUDE = {
  purchaseOrder: { include: { supplier: true } },
  warehouse: true,
  items: {
    include: {
      item: { select: { id: true, sku: true, name: true } },
      batch: { select: { id: true, batchNumber: true } },
      serialNumber: { select: { id: true, serialNumber: true } },
    },
  },
}

const ENTRY_NOTE_LIST_INCLUDE = {
  purchaseOrder: { include: { supplier: true } },
  warehouse: true,
  items: {
    include: {
      item: { select: { id: true, sku: true, name: true } },
    },
  },
}

export class EntryNoteService {
  /**
   * Crear nota de entrada
   */
  async createEntryNote(
    data: ICreateEntryNoteInput,
    userId?: string
  ): Promise<IEntryNoteWithRelations> {
    // Validar almacén
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: data.warehouseId },
    })
    if (!warehouse) {
      throw new NotFoundError(INVENTORY_MESSAGES.entryNote.warehouseNotFound)
    }

    // PURCHASE type requiere purchaseOrderId — usar receiveOrder() del PO service en su lugar
    if (data.type === 'PURCHASE' && !data.purchaseOrderId) {
      throw new BadRequestError(
        'Las notas de entrada tipo PURCHASE requieren una orden de compra. Use el endpoint de recepción de OC.'
      )
    }

    // Si tiene purchaseOrderId, validar que existe y está en estado válido
    if (data.purchaseOrderId) {
      const po = await prisma.purchaseOrder.findUnique({
        where: { id: data.purchaseOrderId },
      })
      if (!po) {
        throw new NotFoundError(
          INVENTORY_MESSAGES.entryNote.purchaseOrderNotFound
        )
      }
      if (
        po.status === 'COMPLETED' ||
        po.status === 'CANCELLED' ||
        po.status === 'DRAFT'
      ) {
        throw new BadRequestError(
          `No se puede crear nota de entrada para una OC con estado ${po.status}. La OC debe estar en estado SENT o PARTIAL.`
        )
      }
    }

    // Generar número de nota de entrada único
    const entryNoteCount = await prisma.entryNote.count()
    const entryNoteNumber = `EN-${new Date().getFullYear()}-${String(entryNoteCount + 1).padStart(5, '0')}`

    const entryNote = await prisma.entryNote.create({
      data: {
        entryNoteNumber,
        type: data.type || 'PURCHASE',
        status: 'PENDING',
        purchaseOrderId: data.purchaseOrderId ?? null,
        warehouseId: data.warehouseId,
        supplierName: data.supplierName ?? null,
        supplierId: data.supplierId ?? null,
        supplierPhone: data.supplierPhone ?? null,
        reason: data.reason ?? null,
        reference: data.reference ?? null,
        notes: data.notes ?? null,
        receivedBy: data.receivedBy || userId || null,
        authorizedBy: data.authorizedBy ?? null,
      },
      include: ENTRY_NOTE_INCLUDE,
    })

    logger.info('Nota de entrada creada', {
      entryNoteId: entryNote.id,
      entryNoteNumber: entryNote.entryNoteNumber,
      type: entryNote.type,
    })

    return this.enrichEntryNote(entryNote) as unknown as IEntryNoteWithRelations
  }

  /**
   * Obtener nota de entrada por ID
   */
  async getEntryNoteById(
    id: string,
    includeItems: boolean = true
  ): Promise<IEntryNoteWithRelations> {
    const include: any = {
      purchaseOrder: { include: { supplier: true } },
      warehouse: true,
    }

    if (includeItems) {
      include.items = ENTRY_NOTE_INCLUDE.items
    }

    const entryNote = await prisma.entryNote.findUnique({
      where: { id },
      include,
    })

    if (!entryNote) {
      throw new NotFoundError(INVENTORY_MESSAGES.entryNote.notFound)
    }

    return this.enrichEntryNote(entryNote) as unknown as IEntryNoteWithRelations
  }

  /**
   * Obtener todas las notas de entrada con filtros y paginación
   */
  async getEntryNotes(
    filters: IEntryNoteFilters = {}
  ): Promise<IEntryNoteListResult> {
    const page = filters.page || 1
    const limit = filters.limit || 20
    const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

    const where: any = {}
    if (filters.type) where.type = filters.type
    if (filters.status) where.status = filters.status
    if (filters.purchaseOrderId) where.purchaseOrderId = filters.purchaseOrderId
    if (filters.warehouseId) where.warehouseId = filters.warehouseId
    if (filters.receivedBy) where.receivedBy = filters.receivedBy

    if (filters.receivedFrom || filters.receivedTo) {
      where.createdAt = {}
      if (filters.receivedFrom) where.createdAt.gte = filters.receivedFrom
      if (filters.receivedTo) where.createdAt.lte = filters.receivedTo
    }

    const sortBy = filters.sortBy || 'createdAt'
    const sortOrder = filters.sortOrder || 'desc'

    const [total, entryNotes] = await Promise.all([
      prisma.entryNote.count({ where }),
      prisma.entryNote.findMany({
        where,
        include: ENTRY_NOTE_LIST_INCLUDE,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
      }),
    ])

    const enriched = await Promise.all(
      entryNotes.map((en) => this.enrichEntryNote(en))
    )

    return {
      entryNotes: enriched as unknown as IEntryNoteWithRelations[],
      total,
      page,
      limit,
    }
  }

  /**
   * Actualizar nota de entrada
   */
  async updateEntryNote(
    id: string,
    data: IUpdateEntryNoteInput
  ): Promise<IEntryNoteWithRelations> {
    const entryNote = await prisma.entryNote.findUnique({
      where: { id },
    })

    if (!entryNote) {
      throw new NotFoundError(INVENTORY_MESSAGES.entryNote.notFound)
    }

    // Validar transiciones de estado
    if (data.status) {
      this.validateStatusTransition(
        entryNote.status as EntryNoteStatus,
        data.status
      )
    }

    const updateData: any = {}
    if (data.status !== undefined) {
      updateData.status = data.status
      if (data.status === 'COMPLETED') updateData.verifiedAt = new Date()
      if (data.status === 'IN_PROGRESS') updateData.receivedAt = new Date()
    }
    if (data.notes !== undefined) updateData.notes = data.notes ?? null
    if (data.receivedBy !== undefined)
      updateData.receivedBy = data.receivedBy ?? null
    if (data.verifiedBy !== undefined)
      updateData.verifiedBy = data.verifiedBy ?? null
    if (data.authorizedBy !== undefined)
      updateData.authorizedBy = data.authorizedBy ?? null
    if (data.supplierName !== undefined)
      updateData.supplierName = data.supplierName ?? null
    if (data.supplierId !== undefined)
      updateData.supplierId = data.supplierId ?? null
    if (data.supplierPhone !== undefined)
      updateData.supplierPhone = data.supplierPhone ?? null
    if (data.reason !== undefined) updateData.reason = data.reason ?? null
    if (data.reference !== undefined)
      updateData.reference = data.reference ?? null

    const updated = await prisma.entryNote.update({
      where: { id },
      data: updateData,
      include: ENTRY_NOTE_INCLUDE,
    })

    logger.info('Nota de entrada actualizada', { entryNoteId: id, data })

    return this.enrichEntryNote(updated) as unknown as IEntryNoteWithRelations
  }

  /**
   * Agregar item a la nota de entrada
   */
  async addItem(
    entryNoteId: string,
    data: ICreateEntryNoteItemInput
  ): Promise<IEntryNoteItem> {
    const entryNote = await prisma.entryNote.findUnique({
      where: { id: entryNoteId },
    })

    if (!entryNote) {
      throw new NotFoundError(INVENTORY_MESSAGES.entryNote.notFound)
    }

    if (entryNote.status === 'COMPLETED' || entryNote.status === 'CANCELLED') {
      throw new BadRequestError(
        INVENTORY_MESSAGES.entryNote.cannotAddItems.replace(
          '{{status}}',
          entryNote.status
        )
      )
    }

    // Validar que el item existe
    const item = await prisma.item.findUnique({ where: { id: data.itemId } })
    if (!item) {
      throw new NotFoundError(INVENTORY_MESSAGES.entryNote.itemNotFound)
    }

    // Si la nota está vinculada a una OC, validar ítem pertenece a la OC y cantidad no excede pendiente
    if (entryNote.purchaseOrderId) {
      const poItem = await prisma.purchaseOrderItem.findFirst({
        where: {
          purchaseOrderId: entryNote.purchaseOrderId,
          itemId: data.itemId,
        },
      })
      if (!poItem) {
        throw new BadRequestError(
          `El ítem "${item.name}" no pertenece a la orden de compra vinculada.`
        )
      }
      const pending =
        (poItem.quantityOrdered ?? 0) - (poItem.quantityReceived ?? 0)
      if (data.quantityReceived > pending) {
        throw new BadRequestError(
          `Cantidad recibida (${data.quantityReceived}) excede la cantidad pendiente (${pending}) para "${item.name}".`
        )
      }
    }

    const entryNoteItem = await prisma.entryNoteItem.create({
      data: {
        entryNoteId,
        itemId: data.itemId,
        quantityReceived: data.quantityReceived,
        unitCost: data.unitCost,
        storedToLocation: data.storedToLocation ?? null,
        batchId: data.batchId ?? null,
        serialNumberId: data.serialNumberId ?? null,
        batchNumber: data.batchNumber ?? null,
        expiryDate: data.expiryDate ?? null,
        notes: data.notes ?? null,
      },
      include: {
        item: { select: { id: true, sku: true, name: true } },
        batch: { select: { id: true, batchNumber: true } },
        serialNumber: { select: { id: true, serialNumber: true } },
      },
    })

    logger.info('Item agregado a nota de entrada', {
      entryNoteId,
      itemId: data.itemId,
      quantity: data.quantityReceived,
    })

    return this.mapEntryNoteItem(entryNoteItem)
  }

  /**
   * Obtener items de una nota de entrada
   */
  async getItems(entryNoteId: string): Promise<IEntryNoteItem[]> {
    const items = await prisma.entryNoteItem.findMany({
      where: { entryNoteId },
      include: {
        item: { select: { id: true, sku: true, name: true } },
        batch: { select: { id: true, batchNumber: true } },
        serialNumber: { select: { id: true, serialNumber: true } },
      },
    })

    return items.map((item) => this.mapEntryNoteItem(item))
  }

  /**
   * Eliminar nota de entrada (solo si no está completada)
   */
  async deleteEntryNote(id: string): Promise<void> {
    const entryNote = await prisma.entryNote.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!entryNote) {
      throw new NotFoundError(INVENTORY_MESSAGES.entryNote.notFound)
    }

    if (entryNote.status === 'COMPLETED') {
      throw new BadRequestError(INVENTORY_MESSAGES.entryNote.cannotDelete)
    }

    // Eliminar items primero, luego la nota
    if (entryNote.items.length > 0) {
      await prisma.entryNoteItem.deleteMany({ where: { entryNoteId: id } })
    }

    await prisma.entryNote.delete({ where: { id } })

    logger.info('Nota de entrada eliminada', { entryNoteId: id })
  }

  /**
   * Iniciar procesamiento de nota de entrada (PENDING → IN_PROGRESS)
   */
  async startEntryNote(
    id: string,
    userId?: string
  ): Promise<IEntryNoteWithRelations> {
    const entryNote = await prisma.entryNote.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!entryNote) {
      throw new NotFoundError(INVENTORY_MESSAGES.entryNote.notFound)
    }

    this.validateStatusTransition(
      entryNote.status as EntryNoteStatus,
      'IN_PROGRESS'
    )

    if (!entryNote.items || entryNote.items.length === 0) {
      throw new BadRequestError(
        'No se puede iniciar una nota de entrada sin artículos'
      )
    }

    const updated = await prisma.entryNote.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        receivedAt: new Date(),
        receivedBy: userId || entryNote.receivedBy,
      },
      include: ENTRY_NOTE_INCLUDE,
    })

    logger.info('Nota de entrada iniciada', {
      entryNoteId: id,
      entryNoteNumber: updated.entryNoteNumber,
    })

    return this.enrichEntryNote(updated) as unknown as IEntryNoteWithRelations
  }

  /**
   * Completar nota de entrada (IN_PROGRESS → COMPLETED)
   * Actualiza stock y crea movimientos atómicamente
   */
  async completeEntryNote(
    id: string,
    userId?: string
  ): Promise<IEntryNoteWithRelations> {
    const entryNote = await prisma.entryNote.findUnique({
      where: { id },
      include: {
        ...ENTRY_NOTE_INCLUDE,
        items: {
          include: {
            item: { select: { id: true, sku: true, name: true } },
          },
        },
      },
    })

    if (!entryNote) {
      throw new NotFoundError(INVENTORY_MESSAGES.entryNote.notFound)
    }

    this.validateStatusTransition(
      entryNote.status as EntryNoteStatus,
      'COMPLETED'
    )

    if (!entryNote.items || entryNote.items.length === 0) {
      throw new BadRequestError(
        'No se puede completar una nota de entrada sin artículos'
      )
    }

    // Para notas de TRANSFER: validar que la nota de salida ya fue entregada
    if (entryNote.type === 'TRANSFER') {
      const transfer = await prisma.transfer.findFirst({
        where: { entryNoteId: id },
        include: {
          exitNote: {
            select: { id: true, status: true, exitNoteNumber: true },
          },
        },
      })

      if (transfer?.exitNote && transfer.exitNote.status !== 'DELIVERED') {
        throw new BadRequestError(
          `No se puede completar la recepción. La nota de salida ${transfer.exitNote.exitNoteNumber} aún no ha sido entregada (estado: ${transfer.exitNote.status}). Primero debe realizarse la salida del almacén origen.`
        )
      }
    }

    // Mapear EntryType → MovementType
    const movementTypeMap: Record<string, string> = {
      PURCHASE: 'PURCHASE',
      RETURN: 'SUPPLIER_RETURN',
      TRANSFER: 'TRANSFER',
      WARRANTY_RETURN: 'SUPPLIER_RETURN',
      LOAN_RETURN: 'LOAN_RETURN',
      ADJUSTMENT_IN: 'ADJUSTMENT_IN',
      DONATION: 'ADJUSTMENT_IN',
      SAMPLE: 'ADJUSTMENT_IN',
      OTHER: 'ADJUSTMENT_IN',
    }
    const movementType = movementTypeMap[entryNote.type] || 'ADJUSTMENT_IN'

    // Ejecutar todo en transacción atómica
    const result = await prisma.$transaction(async (tx) => {
      // 1. Actualizar estado de la nota
      const updated = await tx.entryNote.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          verifiedAt: new Date(),
          verifiedBy: userId || null,
        },
      })

      // 2. Para cada item: upsert stock + crear movement
      for (const noteItem of entryNote.items) {
        const unitCost =
          typeof noteItem.unitCost === 'number'
            ? noteItem.unitCost
            : parseFloat(String(noteItem.unitCost))

        // 2a. Upsert Stock
        const existingStock = await tx.stock.findUnique({
          where: {
            itemId_warehouseId: {
              itemId: noteItem.itemId,
              warehouseId: entryNote.warehouseId,
            },
          },
        })

        if (existingStock) {
          const newReal = existingStock.quantityReal + noteItem.quantityReceived
          const newAvailable =
            existingStock.quantityAvailable + noteItem.quantityReceived

          // Calcular costo promedio ponderado
          const existingTotal =
            existingStock.quantityReal *
            parseFloat(String(existingStock.averageCost))
          const newTotal = noteItem.quantityReceived * unitCost
          const newAverageCost =
            newReal > 0 ? (existingTotal + newTotal) / newReal : unitCost

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
              itemId: noteItem.itemId,
              warehouseId: entryNote.warehouseId,
              quantityReal: noteItem.quantityReceived,
              quantityReserved: 0,
              quantityAvailable: noteItem.quantityReceived,
              averageCost: unitCost,
              lastMovementAt: new Date(),
            },
          })
        }

        // 2b. Crear Movement
        const movementNumber =
          await MovementNumberGenerator.generateMovementNumber(tx, 'MOV')

        await tx.movement.create({
          data: {
            movementNumber,
            type: movementType as any,
            itemId: noteItem.itemId,
            warehouseToId: entryNote.warehouseId,
            quantity: noteItem.quantityReceived,
            unitCost,
            totalCost: noteItem.quantityReceived * unitCost,
            reference: entryNote.entryNoteNumber,
            entryNoteId: entryNote.id,
            purchaseOrderId: entryNote.purchaseOrderId || undefined,
            notes: `Nota de entrada ${entryNote.entryNoteNumber} completada — ${noteItem.item?.name || noteItem.itemId}`,
            createdBy: userId || null,
          },
        })
      }

      // 3. Retornar nota actualizada
      return tx.entryNote.findUnique({
        where: { id },
        include: ENTRY_NOTE_INCLUDE,
      })
    })

    if (!result) throw new Error('Error al completar la nota de entrada')

    logger.info('Nota de entrada completada con stock actualizado', {
      entryNoteId: id,
      entryNoteNumber: entryNote.entryNoteNumber,
      itemsProcessed: entryNote.items.length,
    })

    return this.enrichEntryNote(result) as unknown as IEntryNoteWithRelations
  }

  /**
   * Cancelar nota de entrada (PENDING|IN_PROGRESS → CANCELLED)
   */
  async cancelEntryNote(
    id: string,
    userId?: string
  ): Promise<IEntryNoteWithRelations> {
    const entryNote = await prisma.entryNote.findUnique({
      where: { id },
    })

    if (!entryNote) {
      throw new NotFoundError(INVENTORY_MESSAGES.entryNote.notFound)
    }

    this.validateStatusTransition(
      entryNote.status as EntryNoteStatus,
      'CANCELLED'
    )

    const updated = await prisma.entryNote.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
      include: ENTRY_NOTE_INCLUDE,
    })

    logger.info('Nota de entrada cancelada', {
      entryNoteId: id,
      entryNoteNumber: updated.entryNoteNumber,
    })

    return this.enrichEntryNote(updated) as unknown as IEntryNoteWithRelations
  }

  /**
   * Validar transiciones de estado
   */
  private validateStatusTransition(
    currentStatus: EntryNoteStatus,
    newStatus: EntryNoteStatus
  ): void {
    const validTransitions: Record<EntryNoteStatus, EntryNoteStatus[]> = {
      PENDING: ['IN_PROGRESS', 'CANCELLED'],
      IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: [],
    }

    const allowed = validTransitions[currentStatus]
    if (!allowed || !allowed.includes(newStatus)) {
      throw new BadRequestError(
        INVENTORY_MESSAGES.entryNote.invalidStatusTransition
          .replace('{{from}}', currentStatus)
          .replace('{{to}}', newStatus)
      )
    }
  }

  /**
   * Enriquecer nota de entrada con nombres de usuario
   */
  private async enrichEntryNote(entryNote: any): Promise<any> {
    let receivedByName: string | null = null
    if (entryNote.receivedBy) {
      const user = await prisma.user.findUnique({
        where: { id: entryNote.receivedBy },
        select: { nombre: true, correo: true },
      })
      if (user) {
        receivedByName = user.nombre || user.correo || entryNote.receivedBy
      }
    }

    return { ...entryNote, receivedByName }
  }

  /**
   * Mapear item de prisma a interface
   */
  private mapEntryNoteItem(item: any): IEntryNoteItem {
    return {
      id: item.id,
      entryNoteId: item.entryNoteId,
      itemId: item.itemId,
      quantityReceived: item.quantityReceived,
      unitCost:
        typeof item.unitCost === 'number'
          ? item.unitCost
          : parseFloat(String(item.unitCost)),
      storedToLocation: item.storedToLocation,
      batchId: item.batchId,
      serialNumberId: item.serialNumberId,
      batchNumber: item.batchNumber,
      expiryDate: item.expiryDate,
      notes: item.notes,
      createdAt: item.createdAt,
      item: item.item,
      batch: item.batch,
      serialNumber: item.serialNumber,
    }
  }
}
