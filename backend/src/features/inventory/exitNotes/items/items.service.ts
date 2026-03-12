// backend/src/features/inventory/exitNotes/items/items.service.ts

import { PrismaClient, Prisma } from '../../../../generated/prisma/client.js'
import prisma from '../../../../services/prisma.service.js'
import {
  NotFoundError,
  BadRequestError,
} from '../../../../shared/utils/apiError.js'
import { logger } from '../../../../shared/utils/logger.js'
import {
  IExitNoteItemDetails,
  ItemPickingStatus,
  IExitNoteItemsSummary,
} from './items.interface.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Determina el picking status a partir de los campos reales del modelo.
 * SIN parsing de strings en notes — usa pickedFromLocation como señal de picked.
 * Para REJECTED/VERIFIED se usa el prefijo en notes solo como fallback
 * hasta que el schema agregue un campo `pickingStatus` explícito.
 */
function derivePickingStatus(item: {
  pickedFromLocation: string | null
  notes: string | null
}): ItemPickingStatus {
  if (item.notes?.startsWith('REJECTED:')) return ItemPickingStatus.REJECTED
  if (item.notes?.startsWith('VERIFIED:')) return ItemPickingStatus.VERIFIED
  if (item.pickedFromLocation) return ItemPickingStatus.PICKED
  return ItemPickingStatus.NOT_STARTED
}

function mapToItemDetails(item: {
  id: string
  exitNoteId: string
  itemId: string
  quantity: number
  pickedFromLocation: string | null
  batchId: string | null
  serialNumberId: string | null
  notes: string | null
  createdAt: Date
}): IExitNoteItemDetails {
  return {
    id: item.id,
    exitNoteId: item.exitNoteId,
    itemId: item.itemId,
    quantity: item.quantity,
    pickingStatus: derivePickingStatus(item),
    createdAt: item.createdAt,
    ...(item.pickedFromLocation
      ? { pickedFromLocation: item.pickedFromLocation }
      : {}),
    ...(item.batchId ? { batchId: item.batchId } : {}),
    ...(item.serialNumberId ? { serialNumberId: item.serialNumberId } : {}),
    ...(item.notes ? { notes: item.notes } : {}),
  }
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class ExitNoteItemsService {
  // -------------------------------------------------------------------------
  // READ
  // -------------------------------------------------------------------------

  /**
   * Obtiene todos los items de una nota de salida.
   * Tenant-safe: verifica que la exitNote pertenezca a la empresa.
   */
  async getItems(
    exitNoteId: string,
    empresaId: string,
    db: PrismaClientType = prisma
  ): Promise<IExitNoteItemDetails[]> {
    // Verificar tenant antes de retornar items
    const exitNote = await db.exitNote.findFirst({
      where: { id: exitNoteId, warehouse: { empresaId } },
      select: { id: true },
    })
    if (!exitNote) throw new NotFoundError('Nota de salida no encontrada')

    const items = await db.exitNoteItem.findMany({
      where: { exitNoteId },
      orderBy: { createdAt: 'asc' },
    })

    return items.map(mapToItemDetails)
  }

  /**
   * Obtiene un item específico.
   * Tenant-safe: verifica via exitNote → warehouse → empresaId.
   */
  async getItem(
    exitNoteItemId: string,
    empresaId: string,
    db: PrismaClientType = prisma
  ): Promise<IExitNoteItemDetails> {
    const item = await db.exitNoteItem.findFirst({
      where: {
        id: exitNoteItemId,
        exitNote: { warehouse: { empresaId } },
      },
    })
    if (!item) throw new NotFoundError('Item no encontrado')
    return mapToItemDetails(item)
  }

  /**
   * Resumen de picking para una nota de salida.
   */
  async getSummary(
    exitNoteId: string,
    empresaId: string,
    db: PrismaClientType = prisma
  ): Promise<IExitNoteItemsSummary> {
    const exitNote = await db.exitNote.findFirst({
      where: { id: exitNoteId, warehouse: { empresaId } },
      select: { id: true },
    })
    if (!exitNote) throw new NotFoundError('Nota de salida no encontrada')

    const items = await db.exitNoteItem.findMany({ where: { exitNoteId } })

    if (items.length === 0) {
      return {
        exitNoteId,
        totalItems: 0,
        totalQuantity: 0,
        itemsNotPicked: 0,
        itemsPicked: 0,
        itemsVerified: 0,
        itemsRejected: 0,
        completionPercentage: 0,
        pickingStatus: 'NOT_STARTED',
      }
    }

    const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0)
    const statuses = items.map(derivePickingStatus)
    const itemsPicked = statuses.filter(
      (s) => s === ItemPickingStatus.PICKED || s === ItemPickingStatus.VERIFIED
    ).length
    const itemsVerified = statuses.filter(
      (s) => s === ItemPickingStatus.VERIFIED
    ).length
    const itemsRejected = statuses.filter(
      (s) => s === ItemPickingStatus.REJECTED
    ).length

    let pickingStatus: IExitNoteItemsSummary['pickingStatus'] = 'NOT_STARTED'
    if (itemsPicked === 0 && itemsRejected === 0) {
      pickingStatus = 'NOT_STARTED'
    } else if (itemsVerified === items.length) {
      pickingStatus = 'COMPLETE'
    } else if (itemsVerified + itemsRejected === items.length) {
      pickingStatus = 'COMPLETE_WITH_ISSUES'
    } else {
      pickingStatus = 'IN_PROGRESS'
    }

    return {
      exitNoteId,
      totalItems: items.length,
      totalQuantity,
      itemsNotPicked: items.length - itemsPicked,
      itemsPicked,
      itemsVerified,
      itemsRejected,
      completionPercentage: Math.round(
        ((itemsPicked + itemsRejected) / items.length) * 100
      ),
      pickingStatus,
    }
  }

  // -------------------------------------------------------------------------
  // MUTATIONS
  // -------------------------------------------------------------------------

  /**
   * Registra el picking de un item (ubicación física de donde se tomó).
   */
  async recordPicking(
    exitNoteItemId: string,
    pickedFromLocation: string,
    empresaId: string,
    userId: string,
    notes?: string,
    db: PrismaClientType = prisma
  ): Promise<IExitNoteItemDetails> {
    const item = await db.exitNoteItem.findFirst({
      where: {
        id: exitNoteItemId,
        exitNote: { warehouse: { empresaId } },
      },
    })
    if (!item) throw new NotFoundError('Item no encontrado')

    const currentStatus = derivePickingStatus(item)
    if (currentStatus === ItemPickingStatus.REJECTED) {
      throw new BadRequestError(
        'No se puede registrar picking de un item rechazado'
      )
    }

    const updatedNotes = notes
      ? `${item.notes ? item.notes + '\n' : ''}${notes}`
      : item.notes

    const updated = await db.exitNoteItem.update({
      where: { id: exitNoteItemId },
      data: {
        pickedFromLocation,
        ...(updatedNotes !== null ? { notes: updatedNotes } : {}),
      },
    })

    logger.info(`Item picking registrado: ${exitNoteItemId}`, {
      pickedFromLocation,
      userId,
    })
    return mapToItemDetails(updated)
  }

  /**
   * Verifica un item — registra que la cantidad fue confirmada.
   * Usa prefijo VERIFIED: en notes (campo disponible en schema actual).
   */
  async verifyItem(
    exitNoteItemId: string,
    quantityVerified: number,
    empresaId: string,
    userId: string,
    notes?: string,
    db: PrismaClientType = prisma
  ): Promise<IExitNoteItemDetails> {
    const item = await db.exitNoteItem.findFirst({
      where: {
        id: exitNoteItemId,
        exitNote: { warehouse: { empresaId } },
      },
    })
    if (!item) throw new NotFoundError('Item no encontrado')
    if (!item.pickedFromLocation) {
      throw new BadRequestError(
        'El item debe estar en estado PICKED antes de verificar'
      )
    }
    if (quantityVerified > item.quantity) {
      throw new BadRequestError(
        `No se puede verificar ${quantityVerified} unidades. Solo se requieren ${item.quantity}.`
      )
    }

    const discrepancy = item.quantity - quantityVerified
    const verificationNote =
      discrepancy !== 0
        ? `VERIFIED: qty=${quantityVerified} (discrepancia: ${discrepancy}) by=${userId}${notes ? ' | ' + notes : ''}`
        : `VERIFIED: qty=${quantityVerified} by=${userId}${notes ? ' | ' + notes : ''}`

    const updated = await db.exitNoteItem.update({
      where: { id: exitNoteItemId },
      data: { notes: verificationNote },
    })

    if (discrepancy !== 0) {
      logger.warn(
        `Discrepancia en verificación: item=${exitNoteItemId} esperado=${item.quantity} encontrado=${quantityVerified}`
      )
    }

    return mapToItemDetails(updated)
  }

  /**
   * Rechaza un item (no se puede cumplir).
   * Usa prefijo REJECTED: en notes.
   */
  async rejectItem(
    exitNoteItemId: string,
    reason: string,
    empresaId: string,
    userId: string,
    db: PrismaClientType = prisma
  ): Promise<IExitNoteItemDetails> {
    const item = await db.exitNoteItem.findFirst({
      where: {
        id: exitNoteItemId,
        exitNote: { warehouse: { empresaId } },
      },
    })
    if (!item) throw new NotFoundError('Item no encontrado')

    const currentStatus = derivePickingStatus(item)
    if (currentStatus === ItemPickingStatus.VERIFIED) {
      throw new BadRequestError('No se puede rechazar un item ya verificado')
    }

    const updated = await db.exitNoteItem.update({
      where: { id: exitNoteItemId },
      data: { notes: `REJECTED: ${reason} by=${userId}` },
    })

    logger.info(`Item rechazado: ${exitNoteItemId}`, { reason, userId })
    return mapToItemDetails(updated)
  }

  /**
   * Asigna un batch a un item.
   * Valida que el batch pertenezca al item y tenga stock suficiente.
   */
  async assignBatch(
    exitNoteItemId: string,
    batchId: string,
    empresaId: string,
    userId: string,
    db: PrismaClientType = prisma
  ): Promise<IExitNoteItemDetails> {
    const item = await db.exitNoteItem.findFirst({
      where: {
        id: exitNoteItemId,
        exitNote: { warehouse: { empresaId } },
      },
    })
    if (!item) throw new NotFoundError('Item no encontrado')

    const batch = await db.batch.findFirst({
      where: { id: batchId, item: { empresaId } },
    })
    if (!batch) throw new NotFoundError('Batch no encontrado')
    if (batch.itemId !== item.itemId) {
      throw new BadRequestError('El batch no corresponde al ítem de la nota')
    }
    if (batch.currentQuantity < item.quantity) {
      throw new BadRequestError(
        `Stock insuficiente en batch. Disponible: ${batch.currentQuantity}, Requerido: ${item.quantity}`
      )
    }

    const updated = await db.exitNoteItem.update({
      where: { id: exitNoteItemId },
      data: { batchId },
    })

    logger.info(`Batch asignado: item=${exitNoteItemId} batch=${batchId}`, {
      userId,
    })
    return mapToItemDetails(updated)
  }

  /**
   * Asigna un número de serie a un item.
   * Valida que el serial pertenezca al item correcto.
   */
  async assignSerialNumber(
    exitNoteItemId: string,
    serialNumberId: string,
    empresaId: string,
    userId: string,
    db: PrismaClientType = prisma
  ): Promise<IExitNoteItemDetails> {
    const item = await db.exitNoteItem.findFirst({
      where: {
        id: exitNoteItemId,
        exitNote: { warehouse: { empresaId } },
      },
    })
    if (!item) throw new NotFoundError('Item no encontrado')

    const serial = await db.serialNumber.findFirst({
      where: { id: serialNumberId, item: { empresaId } },
    })
    if (!serial) throw new NotFoundError('Número de serie no encontrado')
    if (serial.itemId !== item.itemId) {
      throw new BadRequestError(
        'El número de serie no corresponde al ítem de la nota'
      )
    }

    const updated = await db.exitNoteItem.update({
      where: { id: exitNoteItemId },
      data: { serialNumberId },
    })

    logger.info(
      `Serial asignado: item=${exitNoteItemId} serial=${serialNumberId}`,
      { userId }
    )
    return mapToItemDetails(updated)
  }
}

export default new ExitNoteItemsService()
