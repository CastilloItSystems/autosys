// backend/src/features/inventory/entryNotes/entryNotes.service.ts

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
import { domainEventBus } from '../../../shared/events/domain-event-bus.js'
import { toDomainEvent } from '../../../shared/events/domain-events.js'
import { createAuditLog } from '../../../services/audit.service.js'
import SupplierBillService from '../../finance/supplierBills/supplierBills.service.js'
import {
  IEntryNoteWithRelations,
  IEntryNoteItem,
  ICreateEntryNoteInput,
  IUpdateEntryNoteInput,
  IEntryNoteFilters,
  ICreateEntryNoteItemInput,
  IEntryNoteListResult,
  EntryNoteStatus,
  EntryType,
} from './entryNotes.interface.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ENTRY_NOTE_INCLUDE = {
  purchaseOrder: { include: { supplier: true } },
  supplierBill: true,
  warehouse: true,
  catalogSupplier: true,
  items: {
    include: {
      item: { select: { id: true, sku: true, name: true } },
      batch: { select: { id: true, batchNumber: true } },
      serialNumber: { select: { id: true, serialNumber: true } },
    },
  },
} as const

const ENTRY_NOTE_LIST_INCLUDE = {
  purchaseOrder: { include: { supplier: true } },
  supplierBill: true,
  warehouse: true,
  catalogSupplier: true,
  items: {
    include: {
      item: { select: { id: true, sku: true, name: true } },
    },
  },
} as const

/** Maps EntryType → MovementType */
const MOVEMENT_TYPE_MAP: Record<EntryType, string> = {
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

const VALID_STATUS_TRANSITIONS: Record<EntryNoteStatus, EntryNoteStatus[]> = {
  PENDING: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
}

const ACTIVE_PURCHASE_ENTRY_NOTE_STATUSES: EntryNoteStatus[] = [
  'PENDING',
  'IN_PROGRESS',
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate an entry note number that avoids race conditions.
 * Uses timestamp + random suffix instead of count().
 */
function generateEntryNoteNumber(): string {
  const year = new Date().getFullYear()
  const ts = Date.now().toString(36).toUpperCase()
  const rnd = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `EN-${year}-${ts}${rnd}`
}

function toNumber(value: unknown): number {
  return typeof value === 'number' ? value : parseFloat(String(value ?? 0))
}

function roundCurrency(value: number): number {
  return Number(value.toFixed(2))
}

function validateStatusTransition(
  current: EntryNoteStatus,
  next: EntryNoteStatus
): void {
  const allowed = VALID_STATUS_TRANSITIONS[current]
  if (!allowed.includes(next)) {
    throw new BadRequestError(
      INVENTORY_MESSAGES.entryNote.invalidStatusTransition
        .replace('{{from}}', current)
        .replace('{{to}}', next)
    )
  }
}

function mapEntryNoteItem(item: Record<string, unknown>): IEntryNoteItem {
  return {
    id: item.id as string,
    entryNoteId: item.entryNoteId as string,
    itemId: item.itemId as string,
    quantityReceived: item.quantityReceived as number,
    unitCost:
      typeof item.unitCost === 'number'
        ? item.unitCost
        : parseFloat(String(item.unitCost)),
    itemName: (item.itemName as string | null) ?? null,
    storedToLocation: (item.storedToLocation as string | null) ?? null,
    batchId: (item.batchId as string | null) ?? null,
    serialNumberId: (item.serialNumberId as string | null) ?? null,
    batchNumber: (item.batchNumber as string | null) ?? null,
    expiryDate: (item.expiryDate as Date | null) ?? null,
    notes: (item.notes as string | null) ?? null,
    createdAt: item.createdAt as Date,
    item: (item.item as IEntryNoteItem['item']) ?? null,
    batch: (item.batch as IEntryNoteItem['batch']) ?? null,
    serialNumber: (item.serialNumber as IEntryNoteItem['serialNumber']) ?? null,
  }
}

function snapshotEntryNote(entryNote: Record<string, unknown> | null) {
  if (!entryNote) return null
  return {
    id: entryNote.id,
    entryNoteNumber: entryNote.entryNoteNumber,
    type: entryNote.type,
    status: entryNote.status,
    purchaseOrderId: entryNote.purchaseOrderId ?? null,
    supplierBillId: entryNote.supplierBillId ?? null,
    warehouseId: entryNote.warehouseId,
    itemCount: Array.isArray(entryNote.items)
      ? entryNote.items.length
      : undefined,
  }
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class EntryNoteService {
  // -------------------------------------------------------------------------
  // CREATE
  // -------------------------------------------------------------------------

  /**
   * Crear nota de entrada.
   * @param empresaId - REQUIRED: tenant safety via warehouse
   */
  async createEntryNote(
    data: ICreateEntryNoteInput,
    empresaId: string,
    userId?: string,
    db: PrismaClientType = prisma
  ): Promise<IEntryNoteWithRelations> {
    // TENANT-SAFE: validate warehouse belongs to this company
    const warehouse = await db.warehouse.findFirst({
      where: { id: data.warehouseId, empresaId },
    })
    if (!warehouse) {
      throw new NotFoundError(INVENTORY_MESSAGES.entryNote.warehouseNotFound)
    }

    // PURCHASE type requires purchaseOrderId
    if (data.type === 'PURCHASE' && !data.purchaseOrderId) {
      throw new BadRequestError(
        'Las notas de entrada tipo PURCHASE requieren una orden de compra. Use el endpoint de recepción de OC.'
      )
    }

    // Validate purchaseOrder if provided
    if (data.purchaseOrderId) {
      const po = await db.purchaseOrder.findFirst({
        where: { id: data.purchaseOrderId, warehouse: { empresaId } },
      })
      if (!po) {
        throw new NotFoundError(
          INVENTORY_MESSAGES.entryNote.purchaseOrderNotFound
        )
      }
      if (['COMPLETED', 'CANCELLED', 'DRAFT'].includes(po.status)) {
        throw new BadRequestError(
          `No se puede crear nota de entrada para una OC con estado ${po.status}. La OC debe estar en estado SENT o PARTIAL.`
        )
      }
    }

    const entryNote = await db.entryNote.create({
      data: {
        entryNoteNumber: generateEntryNoteNumber(),
        type: data.type ?? 'PURCHASE',
        status: 'PENDING',
        purchaseOrderId: data.purchaseOrderId ?? null,
        warehouseId: data.warehouseId,
        catalogSupplierId: data.catalogSupplierId ?? null,
        supplierName: data.supplierName ?? null,
        supplierId: data.supplierId ?? null,
        supplierPhone: data.supplierPhone ?? null,
        reason: data.reason ?? null,
        reference: data.reference ?? null,
        notes: data.notes ?? null,
        receivedBy: data.receivedBy ?? userId ?? null,
        authorizedBy: data.authorizedBy ?? null,
      },
      include: ENTRY_NOTE_INCLUDE,
    })

    logger.info('Nota de entrada creada', {
      entryNoteId: entryNote.id,
      entryNoteNumber: entryNote.entryNoteNumber,
      type: entryNote.type,
      empresaId,
      userId,
    })

    try {
      await domainEventBus.publish(
        toDomainEvent({
          empresaId,
          eventCode: 'inventory.entry_note.created',
          module: 'inventory',
          title: `Nota de entrada ${entryNote.entryNoteNumber} creada`,
          message: `Se creó la nota de entrada ${entryNote.entryNoteNumber}.`,
          type: 'info',
          entityType: 'ENTRY_NOTE',
          entityId: entryNote.id,
          priority: 'MEDIUM',
          severity: 'INFO',
          link: `/empresa/inventario`,
          source: 'inventory.entry_notes',
          dedupKey: `inventory.entry_note.created:${entryNote.id}`,
          metadata: {
            entryNoteId: entryNote.id,
            entryNoteNumber: entryNote.entryNoteNumber,
            status: entryNote.status,
            warehouseId: entryNote.warehouseId,
            type: entryNote.type,
          },
          createdById: userId ?? 'SYSTEM',
          createdByName: 'Sistema',
        })
      )
    } catch (publishError) {
      logger.error('Error publicando evento inventory.entry_note.created', {
        entryNoteId: entryNote.id,
        empresaId,
        error: publishError,
      })
    }

    return entryNote as unknown as IEntryNoteWithRelations
  }

  /**
   * Crear o devolver la nota activa de recepción para una OC enviada.
   * Una OC puede tener múltiples notas completadas, pero solo una PENDING/IN_PROGRESS.
   */
  async ensurePurchaseEntryNoteFromOrder(
    purchaseOrderId: string,
    empresaId: string,
    userId?: string,
    db: PrismaClientType = prisma
  ): Promise<IEntryNoteWithRelations> {
    const po = await db.purchaseOrder.findFirst({
      where: { id: purchaseOrderId, warehouse: { empresaId } },
      include: {
        supplier: true,
        warehouse: true,
        items: {
          include: {
            item: {
              select: { id: true, sku: true, name: true, location: true },
            },
          },
        },
      },
    })

    if (!po) {
      throw new NotFoundError(INVENTORY_MESSAGES.purchaseOrder.notFound)
    }

    if (!['SENT', 'PARTIAL'].includes(po.status)) {
      throw new BadRequestError(
        `No se puede crear nota de entrada para una OC con estado ${po.status}. La OC debe estar en SENT o PARTIAL.`
      )
    }

    const active = await db.entryNote.findFirst({
      where: {
        type: 'PURCHASE',
        purchaseOrderId,
        status: { in: ACTIVE_PURCHASE_ENTRY_NOTE_STATUSES },
        warehouse: { empresaId },
      },
      include: ENTRY_NOTE_INCLUDE,
      orderBy: { createdAt: 'desc' },
    })

    if (active) return active as unknown as IEntryNoteWithRelations

    const pendingItems = po.items.filter((item) => {
      const pending =
        item.quantityPending ??
        Math.max(0, item.quantityOrdered - item.quantityReceived)
      return pending > 0
    })

    if (pendingItems.length === 0) {
      throw new BadRequestError(
        'La orden de compra no tiene cantidades pendientes por recibir'
      )
    }

    const entryNote = await db.entryNote.create({
      data: {
        entryNoteNumber: generateEntryNoteNumber(),
        type: 'PURCHASE',
        status: 'PENDING',
        purchaseOrderId,
        warehouseId: po.warehouseId,
        catalogSupplierId: po.supplierId,
        supplierName: po.supplier?.name ?? null,
        supplierId: po.supplier?.taxId ?? null,
        supplierPhone: po.supplier?.phone ?? null,
        reference: po.orderNumber,
        notes: `Recepción pendiente para OC ${po.orderNumber}`,
        receivedBy: userId ?? null,
        items: {
          create: pendingItems.map((poItem) => {
            const pending =
              poItem.quantityPending ??
              Math.max(0, poItem.quantityOrdered - poItem.quantityReceived)
            return {
              itemId: poItem.itemId,
              itemName: poItem.itemName ?? poItem.item?.name ?? null,
              quantityReceived: pending,
              unitCost: poItem.unitCost,
              storedToLocation: poItem.item?.location ?? null,
              notes: `Saldo pendiente de OC ${po.orderNumber}`,
            }
          }),
        },
      },
      include: ENTRY_NOTE_INCLUDE,
    })

    await createAuditLog(
      {
        entity: 'EntryNote',
        entityId: entryNote.id,
        action: 'ENTRY_NOTE_CREATED_FROM_PO',
        empresaId,
        userId,
        changes: {
          before: null,
          after: snapshotEntryNote(entryNote as unknown as Record<string, unknown>),
        },
        metadata: {
          purchaseOrderId,
          orderNumber: po.orderNumber,
          entryNoteNumber: entryNote.entryNoteNumber,
          pendingItems: pendingItems.length,
        },
      },
      db
    )

    logger.info('Nota de entrada creada desde orden de compra', {
      entryNoteId: entryNote.id,
      purchaseOrderId,
      entryNoteNumber: entryNote.entryNoteNumber,
      empresaId,
      userId,
    })

    return entryNote as unknown as IEntryNoteWithRelations
  }

  // -------------------------------------------------------------------------
  // READ
  // -------------------------------------------------------------------------

  /**
   * Obtener nota de entrada por ID.
   * @param empresaId - REQUIRED: tenant safety via warehouse
   */
  async getEntryNoteById(
    id: string,
    empresaId: string,
    includeItems: boolean = true,
    db: PrismaClientType = prisma
  ): Promise<IEntryNoteWithRelations> {
    const include = {
      purchaseOrder: { include: { supplier: true } },
      warehouse: true,
      ...(includeItems ? { items: ENTRY_NOTE_INCLUDE.items } : {}),
    }

    // TENANT-SAFE: scope via warehouse.empresaId
    const entryNote = await db.entryNote.findFirst({
      where: { id, warehouse: { empresaId } },
      include,
    })

    if (!entryNote) {
      throw new NotFoundError(INVENTORY_MESSAGES.entryNote.notFound)
    }

    return entryNote as unknown as IEntryNoteWithRelations
  }

  /**
   * Obtener todas las notas de entrada con filtros y paginación.
   * @param empresaId - REQUIRED: tenant safety
   */
  async getEntryNotes(
    filters: IEntryNoteFilters = {},
    empresaId: string,
    db: PrismaClientType = prisma
  ): Promise<IEntryNoteListResult> {
    const page = filters.page ?? 1
    const limit = filters.limit ?? 20
    const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

    // TENANT-SAFE: always scope via warehouse.empresaId
    const where: Record<string, unknown> = { warehouse: { empresaId } }

    if (filters.type) where.type = filters.type
    if (filters.status) where.status = filters.status
    if (filters.purchaseOrderId) where.purchaseOrderId = filters.purchaseOrderId
    if (filters.warehouseId) where.warehouseId = filters.warehouseId
    if (filters.catalogSupplierId)
      where.catalogSupplierId = filters.catalogSupplierId
    if (filters.receivedBy) where.receivedBy = filters.receivedBy

    if (filters.search) {
      const search = filters.search.trim()
      where.OR = [
        { entryNoteNumber: { contains: search, mode: 'insensitive' } },
        { supplierName: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
        {
          purchaseOrder: {
            orderNumber: { contains: search, mode: 'insensitive' },
          },
        },
      ]
    }

    if (filters.receivedFrom || filters.receivedTo) {
      const createdAt: Record<string, Date> = {}
      if (filters.receivedFrom) createdAt.gte = filters.receivedFrom
      if (filters.receivedTo) createdAt.lte = filters.receivedTo
      where.createdAt = createdAt
    }

    const sortBy = filters.sortBy ?? 'createdAt'
    const sortOrder = filters.sortOrder ?? 'desc'

    const [total, entryNotes] = await Promise.all([
      db.entryNote.count({ where }),
      db.entryNote.findMany({
        where,
        include: ENTRY_NOTE_LIST_INCLUDE,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
      }),
    ])

    return {
      entryNotes: entryNotes as unknown as IEntryNoteWithRelations[],
      total,
      page,
      limit,
    }
  }

  // -------------------------------------------------------------------------
  // UPDATE
  // -------------------------------------------------------------------------

  /**
   * Actualizar campos de la nota de entrada.
   * @param empresaId - REQUIRED: tenant safety
   */
  async updateEntryNote(
    id: string,
    data: IUpdateEntryNoteInput,
    empresaId: string,
    db: PrismaClientType = prisma
  ): Promise<IEntryNoteWithRelations> {
    // TENANT-SAFE: verify via warehouse
    const entryNote = await db.entryNote.findFirst({
      where: { id, warehouse: { empresaId } },
      include: { items: true },
    })

    if (!entryNote) {
      throw new NotFoundError(INVENTORY_MESSAGES.entryNote.notFound)
    }

    if (data.status) {
      validateStatusTransition(entryNote.status as EntryNoteStatus, data.status)
    }

    const updateData: Record<string, unknown> = {}
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
    if (data.catalogSupplierId !== undefined)
      updateData.catalogSupplierId = data.catalogSupplierId ?? null
    if (data.supplierName !== undefined)
      updateData.supplierName = data.supplierName ?? null
    if (data.supplierId !== undefined)
      updateData.supplierId = data.supplierId ?? null
    if (data.supplierPhone !== undefined)
      updateData.supplierPhone = data.supplierPhone ?? null
    if (data.reason !== undefined) updateData.reason = data.reason ?? null
    if (data.reference !== undefined)
      updateData.reference = data.reference ?? null

    // If items are provided and note is editable, replace all items
    const canEditItems =
      entryNote.status === 'PENDING' || entryNote.status === 'IN_PROGRESS'
    const itemsProvided = Array.isArray(data.items) && data.items.length > 0

    if (canEditItems && itemsProvided) {
      // Validate all items belong to this company
      const itemIds = data.items!.map((i) => i.itemId)
      const existingItems = await db.item.findMany({
        where: { id: { in: itemIds }, empresaId },
        select: { id: true, name: true },
      })
      if (existingItems.length !== itemIds.length) {
        throw new BadRequestError(
          'Uno o más artículos no existen o no pertenecen a esta empresa'
        )
      }
      const itemNameMap = new Map(existingItems.map((i) => [i.id, i.name]))

      if (entryNote.purchaseOrderId) {
        const poItems = await db.purchaseOrderItem.findMany({
          where: { purchaseOrderId: entryNote.purchaseOrderId },
        })
        const poItemsByItemId = new Map(poItems.map((item) => [item.itemId, item]))
        const receivedByItemId = new Map<string, number>()

        for (const item of data.items!) {
          const poItem = poItemsByItemId.get(item.itemId)
          if (!poItem) {
            throw new BadRequestError(
              `El ítem "${itemNameMap.get(item.itemId) ?? item.itemId}" no pertenece a la orden de compra vinculada.`
            )
          }
          receivedByItemId.set(
            item.itemId,
            (receivedByItemId.get(item.itemId) ?? 0) + item.quantityReceived
          )
        }

        for (const [itemId, quantityReceived] of receivedByItemId) {
          const poItem = poItemsByItemId.get(itemId)!
          const pending =
            poItem.quantityPending ??
            Math.max(0, poItem.quantityOrdered - poItem.quantityReceived)
          if (quantityReceived > pending) {
            throw new BadRequestError(
              `Cantidad recibida (${quantityReceived}) excede la cantidad pendiente (${pending}) para "${itemNameMap.get(itemId) ?? itemId}".`
            )
          }
        }
      }

      // Transaction: delete old items, create new ones, update header
      const updated = await (db as PrismaClient).$transaction(async (tx) => {
        // Delete all existing items
        await tx.entryNoteItem.deleteMany({
          where: { entryNoteId: id },
        })

        // Create new items
        for (const item of data.items!) {
          await tx.entryNoteItem.create({
            data: {
              entryNoteId: id,
              itemId: item.itemId,
              itemName: item.itemName || itemNameMap.get(item.itemId) || null,
              quantityReceived: item.quantityReceived,
              unitCost: item.unitCost,
              storedToLocation: item.storedToLocation ?? null,
              batchNumber: item.batchNumber ?? null,
              expiryDate: item.expiryDate ?? null,
              notes: item.notes ?? null,
            },
          })
        }

        // Update header
        return tx.entryNote.update({
          where: { id },
          data: updateData,
          include: ENTRY_NOTE_INCLUDE,
        })
      }, { timeout: 15000, maxWait: 5000 })

      logger.info('Nota de entrada actualizada con items', {
        entryNoteId: id,
        itemCount: data.items!.length,
        empresaId,
      })

      return updated as unknown as IEntryNoteWithRelations
    }

    // No items — just update header
    const updated = await db.entryNote.update({
      where: { id },
      data: updateData,
      include: ENTRY_NOTE_INCLUDE,
    })

    logger.info('Nota de entrada actualizada', { entryNoteId: id, empresaId })

    return updated as unknown as IEntryNoteWithRelations
  }

  // -------------------------------------------------------------------------
  // ITEMS
  // -------------------------------------------------------------------------

  /**
   * Agregar item a la nota de entrada.
   * @param empresaId - REQUIRED: tenant safety
   */
  async addItem(
    entryNoteId: string,
    data: ICreateEntryNoteItemInput,
    empresaId: string,
    db: PrismaClientType = prisma
  ): Promise<IEntryNoteItem> {
    // TENANT-SAFE: verify entry note via warehouse
    const entryNote = await db.entryNote.findFirst({
      where: { id: entryNoteId, warehouse: { empresaId } },
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

    // TENANT-SAFE: validate item belongs to this company
    const item = await db.item.findFirst({
      where: { id: data.itemId, empresaId },
    })
    if (!item) {
      throw new NotFoundError(INVENTORY_MESSAGES.entryNote.itemNotFound)
    }

    // If linked to a PO, validate item belongs to the PO and qty doesn't exceed pending
    if (entryNote.purchaseOrderId) {
      const poItem = await db.purchaseOrderItem.findFirst({
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

    const entryNoteItem = await db.entryNoteItem.create({
      data: {
        entryNoteId,
        itemId: data.itemId,
        itemName: data.itemName ?? item.name,
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
      empresaId,
    })

    return mapEntryNoteItem(entryNoteItem as unknown as Record<string, unknown>)
  }

  /**
   * Obtener items de una nota de entrada.
   * @param empresaId - REQUIRED: tenant safety
   */
  async getItems(
    entryNoteId: string,
    empresaId: string,
    db: PrismaClientType = prisma
  ): Promise<IEntryNoteItem[]> {
    // TENANT-SAFE: verify entry note via warehouse before returning items
    const entryNote = await db.entryNote.findFirst({
      where: { id: entryNoteId, warehouse: { empresaId } },
    })
    if (!entryNote) {
      throw new NotFoundError(INVENTORY_MESSAGES.entryNote.notFound)
    }

    const items = await db.entryNoteItem.findMany({
      where: { entryNoteId },
      include: {
        item: { select: { id: true, sku: true, name: true } },
        batch: { select: { id: true, batchNumber: true } },
        serialNumber: { select: { id: true, serialNumber: true } },
      },
    })

    return items.map((item) =>
      mapEntryNoteItem(item as unknown as Record<string, unknown>)
    )
  }

  // -------------------------------------------------------------------------
  // DELETE
  // -------------------------------------------------------------------------

  /**
   * Eliminar nota de entrada (solo PENDING o IN_PROGRESS).
   * Items se eliminan automáticamente por onDelete: Cascade en schema.
   * @param empresaId - REQUIRED: tenant safety
   */
  async deleteEntryNote(
    id: string,
    empresaId: string,
    db: PrismaClientType = prisma
  ): Promise<void> {
    // TENANT-SAFE: verify via warehouse
    const entryNote = await db.entryNote.findFirst({
      where: { id, warehouse: { empresaId } },
    })

    if (!entryNote) {
      throw new NotFoundError(INVENTORY_MESSAGES.entryNote.notFound)
    }

    if (entryNote.status === 'COMPLETED') {
      throw new BadRequestError(INVENTORY_MESSAGES.entryNote.cannotDelete)
    }

    // Items deleted automatically via onDelete: Cascade
    await db.entryNote.delete({ where: { id } })

    logger.info('Nota de entrada eliminada', { entryNoteId: id, empresaId })
  }

  // -------------------------------------------------------------------------
  // STATE TRANSITIONS
  // -------------------------------------------------------------------------

  /**
   * Iniciar procesamiento (PENDING → IN_PROGRESS).
   * @param empresaId - REQUIRED: tenant safety
   */
  async startEntryNote(
    id: string,
    empresaId: string,
    userId?: string,
    db: PrismaClientType = prisma
  ): Promise<IEntryNoteWithRelations> {
    // TENANT-SAFE: verify via warehouse
    const entryNote = await db.entryNote.findFirst({
      where: { id, warehouse: { empresaId } },
      include: { items: true },
    })

    if (!entryNote) {
      throw new NotFoundError(INVENTORY_MESSAGES.entryNote.notFound)
    }

    validateStatusTransition(entryNote.status as EntryNoteStatus, 'IN_PROGRESS')

    if (!entryNote.items || entryNote.items.length === 0) {
      throw new BadRequestError(
        'No se puede iniciar una nota de entrada sin artículos'
      )
    }

    const updated = await db.entryNote.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        receivedAt: new Date(),
        receivedBy: userId ?? entryNote.receivedBy ?? null,
      },
      include: ENTRY_NOTE_INCLUDE,
    })

    logger.info('Nota de entrada iniciada', {
      entryNoteId: id,
      entryNoteNumber: updated.entryNoteNumber,
      empresaId,
      userId,
    })

    return updated as unknown as IEntryNoteWithRelations
  }

  /**
   * Completar nota de entrada (IN_PROGRESS → COMPLETED).
   * Actualiza stock y crea movimientos en una transacción atómica.
   * @param empresaId - REQUIRED: tenant safety
   */
  async completeEntryNote(
    id: string,
    empresaId: string,
    userId?: string,
    db: PrismaClientType = prisma
  ): Promise<IEntryNoteWithRelations> {
    // TENANT-SAFE: verify via warehouse — load full data before transaction
    const entryNote = await db.entryNote.findFirst({
      where: { id, warehouse: { empresaId } },
      include: {
        ...ENTRY_NOTE_INCLUDE,
        items: {
          include: {
            item: {
              select: { id: true, sku: true, name: true, location: true },
            },
          },
        },
      },
    })

    if (!entryNote) {
      throw new NotFoundError(INVENTORY_MESSAGES.entryNote.notFound)
    }

    validateStatusTransition(entryNote.status as EntryNoteStatus, 'COMPLETED')

    if (!entryNote.items || entryNote.items.length === 0) {
      throw new BadRequestError(
        'No se puede completar una nota de entrada sin artículos'
      )
    }

    // For TRANSFER type: validate the exit note was already delivered
    if (entryNote.type === 'TRANSFER') {
      const transfer = await db.transfer.findFirst({
        where: { entryNoteId: id },
        include: {
          exitNote: {
            select: { id: true, status: true, exitNoteNumber: true },
          },
        },
      })

      if (transfer?.exitNote && transfer.exitNote.status !== 'DELIVERED') {
        throw new BadRequestError(
          `No se puede completar la recepción. La nota de salida ${transfer.exitNote.exitNoteNumber} aún no ha sido entregada (estado: ${transfer.exitNote.status}).`
        )
      }
    }

    let purchaseOrder: any = null
    const purchaseOrderItemsByItemId = new Map<string, any>()
    const purchaseQuantitiesByItemId = new Map<string, number>()

    if (entryNote.type === 'PURCHASE') {
      if (!entryNote.purchaseOrderId) {
        throw new BadRequestError(
          'La nota de entrada de compra debe estar vinculada a una orden de compra'
        )
      }

      purchaseOrder = await db.purchaseOrder.findFirst({
        where: { id: entryNote.purchaseOrderId, warehouse: { empresaId } },
        include: { supplier: true, items: true },
      })

      if (!purchaseOrder) {
        throw new NotFoundError(INVENTORY_MESSAGES.purchaseOrder.notFound)
      }

      if (!['SENT', 'PARTIAL'].includes(purchaseOrder.status)) {
        throw new BadRequestError(
          `No se puede completar recepción para una OC con estado ${purchaseOrder.status}. Debe estar en SENT o PARTIAL.`
        )
      }

      for (const poItem of purchaseOrder.items) {
        purchaseOrderItemsByItemId.set(poItem.itemId, poItem)
      }

      for (const noteItem of entryNote.items) {
        const poItem = purchaseOrderItemsByItemId.get(noteItem.itemId)
        if (!poItem) {
          throw new BadRequestError(
            `El artículo ${noteItem.itemId} no pertenece a la orden de compra vinculada`
          )
        }
        purchaseQuantitiesByItemId.set(
          noteItem.itemId,
          (purchaseQuantitiesByItemId.get(noteItem.itemId) ?? 0) +
            noteItem.quantityReceived
        )
      }

      for (const [itemId, quantityReceived] of purchaseQuantitiesByItemId) {
        const poItem = purchaseOrderItemsByItemId.get(itemId)!
        const pending =
          poItem.quantityPending ??
          Math.max(0, poItem.quantityOrdered - poItem.quantityReceived)
        if (quantityReceived > pending) {
          throw new BadRequestError(
            `La cantidad a recibir (${quantityReceived}) excede la pendiente (${pending}) para el artículo ${poItem.itemName ?? itemId}`
          )
        }
      }
    }

    const movementType =
      MOVEMENT_TYPE_MAP[entryNote.type as EntryType] ?? 'ADJUSTMENT_IN'

    // Atomic transaction: update status + upsert stock + create movements
    // Timeout: 30s — touches stock × N items, movements × N items, PO items, SupplierBill sync
    const result = await (db as PrismaClient).$transaction(async (tx) => {
      await tx.entryNote.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          verifiedAt: new Date(),
          verifiedBy: userId ?? null,
        },
      })

      for (const noteItem of entryNote.items) {
        const unitCost =
          typeof noteItem.unitCost === 'number'
            ? noteItem.unitCost
            : parseFloat(String(noteItem.unitCost))

        // Upsert stock with weighted average cost
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
          const existingTotal =
            existingStock.quantityReal *
            parseFloat(String(existingStock.averageCost))
          const newAverageCost =
            newReal > 0
              ? (existingTotal + noteItem.quantityReceived * unitCost) / newReal
              : unitCost

          const updateData: any = {
            quantityReal: newReal,
            quantityAvailable: newAvailable,
            averageCost: newAverageCost,
            lastMovementAt: new Date(),
          }
          if (noteItem.storedToLocation) {
            updateData.location = noteItem.storedToLocation
          }

          await tx.stock.update({
            where: { id: existingStock.id },
            data: updateData,
          })
        } else {
          const itemLocation =
            noteItem.storedToLocation || noteItem.item?.location || null

          await tx.stock.create({
            data: {
              itemId: noteItem.itemId,
              warehouseId: entryNote.warehouseId,
              quantityReal: noteItem.quantityReceived,
              quantityReserved: 0,
              quantityAvailable: noteItem.quantityReceived,
              averageCost: unitCost,
              location: itemLocation,
              lastMovementAt: new Date(),
            },
          })
        }

        // Create movement
        const movementNumber = MovementNumberGenerator.generate('MOV')

        await tx.movement.create({
          data: {
            movementNumber,
            type: movementType as never,
            itemId: noteItem.itemId,
            warehouseToId: entryNote.warehouseId,
            quantity: noteItem.quantityReceived,
            unitCost,
            totalCost: noteItem.quantityReceived * unitCost,
            reference: entryNote.entryNoteNumber,
            entryNoteId: entryNote.id,
            ...(entryNote.purchaseOrderId
              ? { purchaseOrderId: entryNote.purchaseOrderId }
              : {}),
            notes: `Nota de entrada ${entryNote.entryNoteNumber} — ${noteItem.item?.name ?? noteItem.itemId}`,
            createdBy: userId ?? null,
          },
        })

        if (purchaseOrder) {
          await tx.itemSupplier.upsert({
            where: {
              itemId_supplierId_empresaId: {
                itemId: noteItem.itemId,
                supplierId: purchaseOrder.supplierId,
                empresaId,
              },
            },
            create: {
              itemId: noteItem.itemId,
              supplierId: purchaseOrder.supplierId,
              empresaId,
              lastPurchasedAt: new Date(),
              lastUnitCost: unitCost,
              purchaseCount: 1,
            },
            update: {
              lastPurchasedAt: new Date(),
              lastUnitCost: unitCost,
              purchaseCount: { increment: 1 },
            },
          })

          await tx.item.update({
            where: { id: noteItem.itemId },
            data: { lastSupplierId: purchaseOrder.supplierId },
          })
        }
      }

      if (purchaseOrder && entryNote.purchaseOrderId) {
        for (const [itemId, quantityReceived] of purchaseQuantitiesByItemId) {
          const poItem = purchaseOrderItemsByItemId.get(itemId)!
          const newQuantityReceived =
            poItem.quantityReceived + quantityReceived
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
        }

        const updatedItems = await tx.purchaseOrderItem.findMany({
          where: { purchaseOrderId: entryNote.purchaseOrderId },
        })
        const allReceived = updatedItems.every(
          (item) =>
            (item.quantityPending ??
              Math.max(0, item.quantityOrdered - item.quantityReceived)) <= 0
        )
        const someReceived = updatedItems.some(
          (item) => item.quantityReceived > 0
        )
        const newStatus = allReceived
          ? 'COMPLETED'
          : someReceived
            ? 'PARTIAL'
            : purchaseOrder.status

        const updatedPurchaseOrder = await tx.purchaseOrder.update({
          where: { id: entryNote.purchaseOrderId },
          data: { status: newStatus as never },
        })

        await createAuditLog(
          {
            entity: 'PurchaseOrder',
            entityId: entryNote.purchaseOrderId,
            action: 'PURCHASE_ORDER_RECEIVED',
            empresaId,
            userId,
            changes: {
              before: {
                id: purchaseOrder.id,
                status: purchaseOrder.status,
                items: purchaseOrder.items.map((item: any) => ({
                  id: item.id,
                  itemId: item.itemId,
                  quantityReceived: item.quantityReceived,
                  quantityPending: item.quantityPending,
                })),
              },
              after: {
                id: updatedPurchaseOrder.id,
                status: updatedPurchaseOrder.status,
                items: updatedItems.map((item) => ({
                  id: item.id,
                  itemId: item.itemId,
                  quantityReceived: item.quantityReceived,
                  quantityPending: item.quantityPending,
                })),
              },
            },
            metadata: {
              orderNumber: purchaseOrder.orderNumber,
              entryNoteId: entryNote.id,
              entryNoteNumber: entryNote.entryNoteNumber,
              itemsReceived: entryNote.items.length,
              status: newStatus,
            },
          },
          tx
        )

        const billService = new SupplierBillService(tx)
        const supplierBill = await billService.syncFromPurchaseOrderReceipt(
          empresaId,
          entryNote.purchaseOrderId,
          userId
        )

        if (supplierBill) {
          await tx.entryNote.update({
            where: { id },
            data: { supplierBillId: supplierBill.id },
          })
        }

        if (newStatus === 'PARTIAL') {
          await this.ensurePurchaseEntryNoteFromOrder(
            entryNote.purchaseOrderId,
            empresaId,
            userId,
            tx
          )
        }
      }

      await createAuditLog(
        {
          entity: 'EntryNote',
          entityId: entryNote.id,
          action: 'ENTRY_NOTE_COMPLETED',
          empresaId,
          userId,
          changes: {
            before: snapshotEntryNote(entryNote as unknown as Record<string, unknown>),
            after: {
              ...snapshotEntryNote(entryNote as unknown as Record<string, unknown>),
              status: 'COMPLETED',
            },
          },
          metadata: {
            entryNoteNumber: entryNote.entryNoteNumber,
            purchaseOrderId: entryNote.purchaseOrderId,
            itemCount: entryNote.items.length,
          },
        },
        tx
      )

      return tx.entryNote.findUnique({
        where: { id },
        include: ENTRY_NOTE_INCLUDE,
      })
    }, { timeout: 30000, maxWait: 10000 })

    if (!result) throw new Error('Error al completar la nota de entrada')

    logger.info('Nota de entrada completada', {
      entryNoteId: id,
      entryNoteNumber: entryNote.entryNoteNumber,
      itemsProcessed: entryNote.items.length,
      empresaId,
      userId,
    })

    try {
      await domainEventBus.publish(
        toDomainEvent({
          empresaId,
          eventCode: 'inventory.entry_note.completed',
          module: 'inventory',
          title: `Recepción ${entryNote.entryNoteNumber} completada`,
          message: `Se completó la recepción de ${entryNote.items.length} artículo(s). Stock actualizado en bodega.`,
          type: 'success',
          entityType: 'ENTRY_NOTE',
          entityId: entryNote.id,
          priority: 'HIGH',
          severity: 'INFO',
          link: `/empresa/inventario`,
          source: 'inventory.entry_notes',
          dedupKey: `inventory.entry_note.completed:${entryNote.id}`,
          metadata: {
            entryNoteId: entryNote.id,
            entryNoteNumber: entryNote.entryNoteNumber,
            purchaseOrderId: entryNote.purchaseOrderId ?? null,
            itemCount: entryNote.items.length,
            warehouseId: entryNote.warehouseId,
          },
          createdById: userId ?? 'SYSTEM',
          createdByName: 'Sistema',
        })
      )
    } catch (publishError) {
      logger.error('Error publicando evento inventory.entry_note.completed', {
        entryNoteId: entryNote.id,
        empresaId,
        error: publishError,
      })
    }

    return result as unknown as IEntryNoteWithRelations
  }

  /**
   * Wrapper temporal para el endpoint legado de recepción de OC.
   * Convierte el payload viejo en una nota de entrada PURCHASE y completa la nota.
   */
  async receivePurchaseOrder(
    purchaseOrderId: string,
    data: {
      notes?: string
      receivedBy?: string
      items: Array<{
        itemId: string
        quantityReceived: number
        unitCost: number
        location?: string | null
        batchNumber?: string | null
        expiryDate?: Date | null
      }>
    },
    empresaId: string,
    userId?: string,
    db: PrismaClientType = prisma
  ): Promise<IEntryNoteWithRelations> {
    const itemsToReceive = data.items
      .filter((item) => item.quantityReceived > 0)
      .map((item) => ({
        itemId: item.itemId,
        quantityReceived: item.quantityReceived,
        unitCost: item.unitCost,
        storedToLocation: item.location ?? null,
        batchNumber: item.batchNumber ?? null,
        expiryDate: item.expiryDate ?? null,
      }))

    if (itemsToReceive.length === 0) {
      throw new BadRequestError('Debe recibir al menos un artículo')
    }

    const note = await this.ensurePurchaseEntryNoteFromOrder(
      purchaseOrderId,
      empresaId,
      userId,
      db
    )

    await this.updateEntryNote(
      note.id,
      {
        notes: data.notes ?? note.notes ?? null,
        receivedBy: data.receivedBy ?? userId ?? note.receivedBy ?? null,
        items: itemsToReceive,
      },
      empresaId,
      db
    )

    const refreshed = await this.getEntryNoteById(note.id, empresaId, true, db)

    if (refreshed.status === 'PENDING') {
      await this.startEntryNote(note.id, empresaId, userId, db)
    }

    return this.completeEntryNote(note.id, empresaId, userId, db)
  }

  /**
   * Cancelar nota de entrada (PENDING | IN_PROGRESS → CANCELLED).
   * @param empresaId - REQUIRED: tenant safety
   */
  async cancelEntryNote(
    id: string,
    empresaId: string,
    userId?: string,
    db: PrismaClientType = prisma
  ): Promise<IEntryNoteWithRelations> {
    // TENANT-SAFE: verify via warehouse
    const entryNote = await db.entryNote.findFirst({
      where: { id, warehouse: { empresaId } },
    })

    if (!entryNote) {
      throw new NotFoundError(INVENTORY_MESSAGES.entryNote.notFound)
    }

    validateStatusTransition(entryNote.status as EntryNoteStatus, 'CANCELLED')

    const updated = await db.entryNote.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: ENTRY_NOTE_INCLUDE,
    })

    logger.info('Nota de entrada cancelada', {
      entryNoteId: id,
      entryNoteNumber: updated.entryNoteNumber,
      empresaId,
      userId,
    })

    return updated as unknown as IEntryNoteWithRelations
  }
}

export default new EntryNoteService()
