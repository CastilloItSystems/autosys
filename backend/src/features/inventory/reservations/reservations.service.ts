// backend/src/features/inventory/reservations/reservations.service.ts

import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import prisma from '../../../services/prisma.service.js'
import { logger } from '../../../shared/utils/logger.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import {
  NotFoundError,
  BadRequestError,
} from '../../../shared/utils/apiError.js'
import {
  IReservationWithRelations,
  ICreateReservationInput,
  IUpdateReservationInput,
  IReservationFilters,
  ReservationStatus,
} from './reservations.interface.js'
import { INVENTORY_MESSAGES } from '../shared/constants/messages.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate a reservation number that is unique within the transaction.
 * Uses a timestamp + random suffix to avoid race conditions from count()-based numbering.
 */
function generateReservationNumber(): string {
  const year = new Date().getFullYear()
  const ts = Date.now().toString(36).toUpperCase()
  const rnd = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `RES-${year}-${ts}${rnd}`
}

const RESERVATION_INCLUDE = {
  item: true,
  exitNote: true,
} as const

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class ReservationService {
  // -------------------------------------------------------------------------
  // CREATE
  // -------------------------------------------------------------------------

  /**
   * Crear reserva y reservar stock en una transacción atómica.
   * @param empresaId - REQUIRED: tenant safety
   */
  async create(
    data: ICreateReservationInput,
    empresaId: string,
    userId?: string,
    db: PrismaClientType = prisma
  ): Promise<IReservationWithRelations> {
    try {
      const reservation = await (db as PrismaClient).$transaction(
        async (tx) => {
          // TENANT-SAFE: validate item belongs to this company
          const item = await tx.item.findFirst({
            where: { id: data.itemId, empresaId },
          })
          if (!item) {
            throw new NotFoundError(INVENTORY_MESSAGES.item.notFound)
          }

          // TENANT-SAFE: validate warehouse belongs to this company
          const warehouse = await tx.warehouse.findFirst({
            where: { id: data.warehouseId, empresaId },
          })
          if (!warehouse) {
            throw new NotFoundError(INVENTORY_MESSAGES.warehouse.notFound)
          }

          // Lock stock row and validate availability
          const stock = await tx.stock.findUnique({
            where: {
              itemId_warehouseId: {
                itemId: data.itemId,
                warehouseId: data.warehouseId,
              },
            },
          })

          if (!stock || stock.quantityAvailable < data.quantity) {
            throw new BadRequestError(
              INVENTORY_MESSAGES.stock.insufficientQuantity
            )
          }

          // Reserve stock atomically
          await tx.stock.update({
            where: { id: stock.id },
            data: {
              quantityReserved: stock.quantityReserved + data.quantity,
              quantityAvailable: stock.quantityAvailable - data.quantity,
              lastMovementAt: new Date(),
            },
          })

          // Create reservation
          return tx.reservation.create({
            data: {
              reservationNumber: generateReservationNumber(),
              itemId: data.itemId,
              warehouseId: data.warehouseId,
              quantity: data.quantity,
              ...(data.workOrderId ? { workOrderId: data.workOrderId } : {}),
              ...(data.saleOrderId ? { saleOrderId: data.saleOrderId } : {}),
              ...(data.exitNoteId ? { exitNoteId: data.exitNoteId } : {}),
              ...(data.reference ? { reference: data.reference } : {}),
              ...(data.notes ? { notes: data.notes } : {}),
              ...(data.expiresAt ? { expiresAt: data.expiresAt } : {}),
              createdBy: userId ?? data.createdBy ?? null,
            },
            include: RESERVATION_INCLUDE,
          })
        }
      )

      logger.info(`Reserva creada: ${reservation.id}`, {
        reservationNumber: reservation.reservationNumber,
        itemId: reservation.itemId,
        quantity: reservation.quantity,
        empresaId,
        userId,
      })

      return reservation as unknown as IReservationWithRelations
    } catch (error) {
      logger.error('Error al crear reserva', { error, data, empresaId })
      throw error
    }
  }

  // -------------------------------------------------------------------------
  // READ
  // -------------------------------------------------------------------------

  /**
   * Obtener reserva por ID.
   * @param empresaId - REQUIRED: tenant safety via item
   */
  async findById(
    id: string,
    empresaId: string,
    db: PrismaClientType = prisma
  ): Promise<IReservationWithRelations> {
    try {
      // TENANT-SAFE: scope via item.empresaId
      const reservation = await db.reservation.findFirst({
        where: { id, item: { empresaId } },
        include: RESERVATION_INCLUDE,
      })

      if (!reservation) {
        throw new NotFoundError(INVENTORY_MESSAGES.reservation.notFound)
      }

      return reservation as unknown as IReservationWithRelations
    } catch (error) {
      logger.error('Error al obtener reserva', { error, id, empresaId })
      throw error
    }
  }

  /**
   * Obtener todas las reservas con filtros y paginación.
   * @param empresaId - REQUIRED: tenant safety
   */
  async findAll(
    filters: IReservationFilters = {},
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'reservedAt',
    sortOrder: 'asc' | 'desc' = 'desc',
    empresaId: string,
    db: PrismaClientType = prisma
  ): Promise<{
    items: IReservationWithRelations[]
    total: number
    page: number
    limit: number
  }> {
    try {
      // TENANT-SAFE: always scope via item.empresaId
      const where: Record<string, unknown> = { item: { empresaId } }

      if (filters.status) where.status = filters.status
      if (filters.itemId) where.itemId = filters.itemId
      if (filters.warehouseId) where.warehouseId = filters.warehouseId
      if (filters.workOrderId) where.workOrderId = filters.workOrderId
      if (filters.saleOrderId) where.saleOrderId = filters.saleOrderId
      if (filters.createdBy) where.createdBy = filters.createdBy

      if (filters.reservedFrom || filters.reservedTo) {
        const reservedAt: Record<string, Date> = {}
        if (filters.reservedFrom) reservedAt.gte = filters.reservedFrom
        if (filters.reservedTo) reservedAt.lte = filters.reservedTo
        where.reservedAt = reservedAt
      }

      const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

      const [total, reservations] = await Promise.all([
        db.reservation.count({ where }),
        db.reservation.findMany({
          where,
          include: RESERVATION_INCLUDE,
          skip,
          take,
          orderBy: { [sortBy]: sortOrder },
        }),
      ])

      return {
        items: reservations as unknown as IReservationWithRelations[],
        total,
        page,
        limit,
      }
    } catch (error) {
      logger.error('Error al obtener reservas', { error, filters, empresaId })
      throw error
    }
  }

  /**
   * Obtener reservas por artículo.
   * @param empresaId - REQUIRED: tenant safety
   */
  async findByItem(
    itemId: string,
    empresaId: string,
    limit: number = 20,
    db: PrismaClientType = prisma
  ): Promise<IReservationWithRelations[]> {
    try {
      const reservations = await db.reservation.findMany({
        where: { itemId, item: { empresaId } },
        include: RESERVATION_INCLUDE,
        take: limit,
        orderBy: { reservedAt: 'desc' },
      })

      return reservations as unknown as IReservationWithRelations[]
    } catch (error) {
      logger.error('Error al obtener reservas del artículo', {
        error,
        itemId,
        empresaId,
      })
      throw error
    }
  }

  /**
   * Obtener reservas por almacén.
   * @param empresaId - REQUIRED: tenant safety
   */
  async findByWarehouse(
    warehouseId: string,
    empresaId: string,
    limit: number = 20,
    db: PrismaClientType = prisma
  ): Promise<IReservationWithRelations[]> {
    try {
      const reservations = await db.reservation.findMany({
        where: { warehouseId, item: { empresaId } },
        include: RESERVATION_INCLUDE,
        take: limit,
        orderBy: { reservedAt: 'desc' },
      })

      return reservations as unknown as IReservationWithRelations[]
    } catch (error) {
      logger.error('Error al obtener reservas del almacén', {
        error,
        warehouseId,
        empresaId,
      })
      throw error
    }
  }

  /**
   * Obtener reservas activas.
   * @param empresaId - REQUIRED: tenant safety
   */
  async findActive(
    empresaId: string,
    limit: number = 20,
    db: PrismaClientType = prisma
  ): Promise<IReservationWithRelations[]> {
    try {
      const reservations = await db.reservation.findMany({
        where: { status: ReservationStatus.ACTIVE, item: { empresaId } },
        include: RESERVATION_INCLUDE,
        take: limit,
        orderBy: { reservedAt: 'desc' },
      })

      return reservations as unknown as IReservationWithRelations[]
    } catch (error) {
      logger.error('Error al obtener reservas activas', { error, empresaId })
      throw error
    }
  }

  /**
   * Obtener reservas expiradas (ACTIVE + expiresAt < now).
   * @param empresaId - REQUIRED: tenant safety
   */
  async findExpired(
    empresaId: string,
    limit: number = 20,
    db: PrismaClientType = prisma
  ): Promise<IReservationWithRelations[]> {
    try {
      const reservations = await db.reservation.findMany({
        where: {
          status: ReservationStatus.ACTIVE,
          expiresAt: { lt: new Date() },
          item: { empresaId },
        },
        include: RESERVATION_INCLUDE,
        take: limit,
        orderBy: { expiresAt: 'asc' },
      })

      return reservations as unknown as IReservationWithRelations[]
    } catch (error) {
      logger.error('Error al obtener reservas expiradas', { error, empresaId })
      throw error
    }
  }

  // -------------------------------------------------------------------------
  // UPDATE
  // -------------------------------------------------------------------------

  /**
   * Actualizar campos de la reserva. Si cambia quantity, recalcula stock.
   * @param empresaId - REQUIRED: tenant safety
   */
  async update(
    id: string,
    data: IUpdateReservationInput,
    empresaId: string,
    userId?: string,
    db: PrismaClientType = prisma
  ): Promise<IReservationWithRelations> {
    try {
      const updated = await (db as PrismaClient).$transaction(async (tx) => {
        // TENANT-SAFE: verify reservation belongs to this company via item
        const reservation = await tx.reservation.findFirst({
          where: { id, item: { empresaId } },
        })

        if (!reservation) {
          throw new NotFoundError(INVENTORY_MESSAGES.reservation.notFound)
        }

        // If quantity changes, validate and adjust stock
        if (
          data.quantity !== undefined &&
          data.quantity !== reservation.quantity
        ) {
          const stock = await tx.stock.findUnique({
            where: {
              itemId_warehouseId: {
                itemId: reservation.itemId,
                warehouseId: reservation.warehouseId,
              },
            },
          })

          const delta = data.quantity - reservation.quantity // positive = more reserved

          // Available stock from current stock + what this reservation holds
          const effectiveAvailable = stock?.quantityAvailable ?? 0

          if (delta > 0 && delta > effectiveAvailable) {
            throw new BadRequestError(
              INVENTORY_MESSAGES.stock.insufficientQuantity
            )
          }

          if (stock) {
            await tx.stock.update({
              where: { id: stock.id },
              data: {
                quantityReserved: stock.quantityReserved + delta,
                quantityAvailable: stock.quantityAvailable - delta,
                lastMovementAt: new Date(),
              },
            })
          }
        }

        const updateData: Record<string, unknown> = {}
        if (data.quantity !== undefined) updateData.quantity = data.quantity
        if (data.status !== undefined) updateData.status = data.status
        if (data.workOrderId !== undefined)
          updateData.workOrderId = data.workOrderId
        if (data.saleOrderId !== undefined)
          updateData.saleOrderId = data.saleOrderId
        if (data.reference !== undefined) updateData.reference = data.reference
        if (data.notes !== undefined) updateData.notes = data.notes
        if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt

        return tx.reservation.update({
          where: { id },
          data: updateData,
          include: RESERVATION_INCLUDE,
        })
      })

      logger.info(`Reserva actualizada: ${id}`, { userId, empresaId, data })

      return updated as unknown as IReservationWithRelations
    } catch (error) {
      logger.error('Error al actualizar reserva', {
        error,
        id,
        data,
        empresaId,
      })
      throw error
    }
  }

  // -------------------------------------------------------------------------
  // OPERATIONS
  // -------------------------------------------------------------------------

  /**
   * Consumir reserva (entregar stock). Atómico.
   * Si quantity < reservation.quantity, crea una reserva nueva para el resto.
   * @param empresaId - REQUIRED: tenant safety
   */
  async consume(
    reservationId: string,
    empresaId: string,
    quantity?: number,
    deliveredBy?: string,
    userId?: string,
    db: PrismaClientType = prisma
  ): Promise<IReservationWithRelations> {
    try {
      const updated = await (db as PrismaClient).$transaction(async (tx) => {
        // TENANT-SAFE: verify reservation belongs to this company via item
        const reservation = await tx.reservation.findFirst({
          where: { id: reservationId, item: { empresaId } },
        })

        if (!reservation) {
          throw new NotFoundError(INVENTORY_MESSAGES.reservation.notFound)
        }

        if (
          reservation.status !== ReservationStatus.ACTIVE &&
          reservation.status !== ReservationStatus.PENDING_PICKUP
        ) {
          throw new BadRequestError(
            `No se puede consumir una reserva con estado ${reservation.status}`
          )
        }

        const consumedQty = quantity ?? reservation.quantity

        if (consumedQty > reservation.quantity) {
          throw new BadRequestError(
            `Cantidad a consumir (${consumedQty}) no puede ser mayor a la reserva (${reservation.quantity})`
          )
        }

        // Adjust stock: decrement reserved, decrement real (items leave warehouse)
        const stock = await tx.stock.findUnique({
          where: {
            itemId_warehouseId: {
              itemId: reservation.itemId,
              warehouseId: reservation.warehouseId,
            },
          },
        })

        if (!stock) {
          throw new NotFoundError(INVENTORY_MESSAGES.stock.notFound)
        }

        await tx.stock.update({
          where: { id: stock.id },
          data: {
            quantityReal: stock.quantityReal - consumedQty,
            quantityReserved: stock.quantityReserved - consumedQty,
            quantityConsumed: stock.quantityConsumed + consumedQty,
            // quantityAvailable stays the same: real - reserved is unchanged
            lastMovementAt: new Date(),
          },
        })

        // If partial consumption, create a new reservation for the remainder
        if (consumedQty < reservation.quantity) {
          const remaining = reservation.quantity - consumedQty
          await tx.reservation.create({
            data: {
              reservationNumber: generateReservationNumber(),
              itemId: reservation.itemId,
              warehouseId: reservation.warehouseId,
              quantity: remaining,
              status: ReservationStatus.ACTIVE,
              ...(reservation.workOrderId
                ? { workOrderId: reservation.workOrderId }
                : {}),
              ...(reservation.saleOrderId
                ? { saleOrderId: reservation.saleOrderId }
                : {}),
              ...(reservation.reference
                ? { reference: reservation.reference }
                : {}),
              ...(reservation.notes ? { notes: reservation.notes } : {}),
              ...(reservation.expiresAt
                ? { expiresAt: reservation.expiresAt }
                : {}),
              createdBy: userId ?? null,
            },
          })
        }

        return tx.reservation.update({
          where: { id: reservationId },
          data: {
            quantity: consumedQty,
            status: ReservationStatus.CONSUMED,
            deliveredAt: new Date(),
            deliveredBy: deliveredBy ?? userId ?? null,
          },
          include: RESERVATION_INCLUDE,
        })
      })

      logger.info(`Reserva consumida: ${reservationId}`, {
        quantity,
        empresaId,
        userId,
      })

      return updated as unknown as IReservationWithRelations
    } catch (error) {
      logger.error('Error al consumir reserva', {
        error,
        reservationId,
        empresaId,
      })
      throw error
    }
  }

  /**
   * Liberar reserva: devuelve stock reservado como disponible. Atómico.
   * @param empresaId - REQUIRED: tenant safety
   */
  async release(
    reservationId: string,
    empresaId: string,
    reason?: string,
    userId?: string,
    db: PrismaClientType = prisma
  ): Promise<IReservationWithRelations> {
    try {
      const updated = await (db as PrismaClient).$transaction(async (tx) => {
        // TENANT-SAFE: verify reservation belongs to this company via item
        const reservation = await tx.reservation.findFirst({
          where: { id: reservationId, item: { empresaId } },
        })

        if (!reservation) {
          throw new NotFoundError(INVENTORY_MESSAGES.reservation.notFound)
        }

        if (
          reservation.status !== ReservationStatus.ACTIVE &&
          reservation.status !== ReservationStatus.PENDING_PICKUP
        ) {
          throw new BadRequestError(
            `No se puede liberar una reserva con estado ${reservation.status}`
          )
        }

        // Return reserved stock to available
        const stock = await tx.stock.findUnique({
          where: {
            itemId_warehouseId: {
              itemId: reservation.itemId,
              warehouseId: reservation.warehouseId,
            },
          },
        })

        if (!stock) {
          throw new NotFoundError(INVENTORY_MESSAGES.stock.notFound)
        }

        await tx.stock.update({
          where: { id: stock.id },
          data: {
            quantityReserved: stock.quantityReserved - reservation.quantity,
            quantityAvailable: stock.quantityAvailable + reservation.quantity,
            lastMovementAt: new Date(),
          },
        })

        const releaseNote = reason ? `[LIBERADO: ${reason}]` : '[LIBERADO]'

        const notes = reservation.notes
          ? `${reservation.notes}\n${releaseNote}`
          : releaseNote

        return tx.reservation.update({
          where: { id: reservationId },
          data: {
            status: ReservationStatus.RELEASED,
            releasedAt: new Date(),
            notes,
          },
          include: RESERVATION_INCLUDE,
        })
      })

      logger.info(`Reserva liberada: ${reservationId}`, {
        reason,
        empresaId,
        userId,
      })

      return updated as unknown as IReservationWithRelations
    } catch (error) {
      logger.error('Error al liberar reserva', {
        error,
        reservationId,
        empresaId,
      })
      throw error
    }
  }

  /**
   * Marcar reserva como pendiente de entrega.
   * @param empresaId - REQUIRED: tenant safety
   */
  async markAsPendingPickup(
    reservationId: string,
    empresaId: string,
    userId?: string,
    db: PrismaClientType = prisma
  ): Promise<IReservationWithRelations> {
    try {
      // TENANT-SAFE: verify reservation belongs to this company via item
      const reservation = await db.reservation.findFirst({
        where: { id: reservationId, item: { empresaId } },
      })

      if (!reservation) {
        throw new NotFoundError(INVENTORY_MESSAGES.reservation.notFound)
      }

      if (reservation.status !== ReservationStatus.ACTIVE) {
        throw new BadRequestError(
          `Solo se pueden marcar como pendientes reservas ACTIVE. Estado actual: ${reservation.status}`
        )
      }

      const updated = await db.reservation.update({
        where: { id: reservationId },
        data: { status: ReservationStatus.PENDING_PICKUP },
        include: RESERVATION_INCLUDE,
      })

      logger.info(`Reserva marcada como pendiente: ${reservationId}`, {
        userId,
        empresaId,
      })

      return updated as unknown as IReservationWithRelations
    } catch (error) {
      logger.error('Error al marcar reserva como pendiente', {
        error,
        reservationId,
        empresaId,
      })
      throw error
    }
  }

  // -------------------------------------------------------------------------
  // DELETE
  // -------------------------------------------------------------------------

  /**
   * Eliminar reserva (solo ACTIVE o PENDING_PICKUP). Libera stock atómicamente.
   * @param empresaId - REQUIRED: tenant safety
   */
  async delete(
    id: string,
    empresaId: string,
    userId?: string,
    db: PrismaClientType = prisma
  ): Promise<{ success: boolean; id: string }> {
    try {
      await (db as PrismaClient).$transaction(async (tx) => {
        // TENANT-SAFE: verify reservation belongs to this company via item
        const reservation = await tx.reservation.findFirst({
          where: { id, item: { empresaId } },
        })

        if (!reservation) {
          throw new NotFoundError(INVENTORY_MESSAGES.reservation.notFound)
        }

        if (
          reservation.status === ReservationStatus.CONSUMED ||
          reservation.status === ReservationStatus.RELEASED
        ) {
          throw new BadRequestError(
            `No se puede eliminar una reserva con estado ${reservation.status}`
          )
        }

        // Return reserved stock before deleting
        const stock = await tx.stock.findUnique({
          where: {
            itemId_warehouseId: {
              itemId: reservation.itemId,
              warehouseId: reservation.warehouseId,
            },
          },
        })

        if (stock) {
          await tx.stock.update({
            where: { id: stock.id },
            data: {
              quantityReserved: stock.quantityReserved - reservation.quantity,
              quantityAvailable: stock.quantityAvailable + reservation.quantity,
              lastMovementAt: new Date(),
            },
          })
        }

        await tx.reservation.delete({ where: { id } })
      })

      logger.info(`Reserva eliminada: ${id}`, { userId, empresaId })

      return { success: true, id }
    } catch (error) {
      logger.error('Error al eliminar reserva', { error, id, empresaId })
      throw error
    }
  }
}

export default new ReservationService()
