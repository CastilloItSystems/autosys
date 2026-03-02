// backend/src/features/inventory/reservations/reservations.service.ts

import prisma from '../../../services/prisma.service'
import { logger } from '../../../shared/utils/logger'
import { PaginationHelper } from '../../../shared/helpers/pagination.helper'
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from '../../../shared/exceptions/api.error'
import {
  IReservation,
  IReservationWithRelations,
  ICreateReservationInput,
  IUpdateReservationInput,
  IReservationFilters,
  ReservationStatus,
} from './reservations.interface'
import { INVENTORY_MESSAGES } from '../../../config/messages'

class ReservationService {
  /**
   * Crear reserva
   */
  async create(
    data: ICreateReservationInput,
    userId?: string
  ): Promise<IReservationWithRelations> {
    try {
      // Validar que el item existe
      const item = await prisma.item.findUnique({
        where: { id: data.itemId },
      })

      if (!item) {
        throw new NotFoundError(INVENTORY_MESSAGES.item.notFound)
      }

      // Validar que el almacén existe
      const warehouse = await prisma.warehouse.findUnique({
        where: { id: data.warehouseId },
      })

      if (!warehouse) {
        throw new NotFoundError(INVENTORY_MESSAGES.warehouse.notFound)
      }

      // Validar que hay suficiente stock disponible
      const stock = await prisma.stock.findFirst({
        where: {
          itemId: data.itemId,
          warehouseId: data.warehouseId,
        },
      })

      if (!stock || stock.quantityAvailable < data.quantity) {
        throw new BadRequestError(INVENTORY_MESSAGES.stock.insufficientQuantity)
      }

      // Generar número de reserva único
      const reservationCount = await prisma.reservation.count()
      const reservationNumber = `RES-${new Date().getFullYear()}-${String(reservationCount + 1).padStart(5, '0')}`

      // Crear reserva
      const reservation = await prisma.reservation.create({
        data: {
          reservationNumber,
          itemId: data.itemId,
          warehouseId: data.warehouseId,
          quantity: data.quantity,
          workOrderId: data.workOrderId,
          saleOrderId: data.saleOrderId,
          exitNoteId: data.exitNoteId,
          reference: data.reference,
          notes: data.notes,
          expiresAt: data.expiresAt,
          createdBy: userId || data.createdBy,
        },
        include: {
          item: true,
          exitNote: true,
        },
      })

      logger.info(`Reserva creada: ${reservation.id}`, {
        reservationNumber: reservation.reservationNumber,
        itemId: reservation.itemId,
        quantity: reservation.quantity,
      })

      return reservation as unknown as IReservationWithRelations
    } catch (error) {
      logger.error('Error al crear reserva', { error, data })
      throw error
    }
  }

  /**
   * Obtener reserva por ID
   */
  async findById(id: string): Promise<IReservationWithRelations> {
    try {
      const reservation = await prisma.reservation.findUnique({
        where: { id },
        include: {
          item: true,
          exitNote: true,
        },
      })

      if (!reservation) {
        throw new NotFoundError(INVENTORY_MESSAGES.reservation.notFound)
      }

      return reservation as unknown as IReservationWithRelations
    } catch (error) {
      logger.error('Error al obtener reserva', { error, id })
      throw error
    }
  }

  /**
   * Obtener todas las reservas con filtros y paginación
   */
  async findAll(
    filters: IReservationFilters = {},
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'reservedAt',
    sortOrder: 'asc' | 'desc' = 'desc',
    prismaClient?: any
  ): Promise<{
    items: IReservationWithRelations[]
    total: number
    page: number
    limit: number
  }> {
    try {
      const { skip, take } = PaginationHelper.validateAndParse(page, limit)

      const where: any = {}
      if (filters.status) where.status = filters.status
      if (filters.itemId) where.itemId = filters.itemId
      if (filters.warehouseId) where.warehouseId = filters.warehouseId
      if (filters.workOrderId) where.workOrderId = filters.workOrderId
      if (filters.saleOrderId) where.saleOrderId = filters.saleOrderId
      if (filters.createdBy) where.createdBy = filters.createdBy

      if (filters.reservedFrom || filters.reservedTo) {
        where.reservedAt = {}
        if (filters.reservedFrom) where.reservedAt.gte = filters.reservedFrom
        if (filters.reservedTo) where.reservedAt.lte = filters.reservedTo
      }

      const [total, reservations] = await Promise.all([
        prisma.reservation.count({ where }),
        prisma.reservation.findMany({
          where,
          include: {
            item: true,
            exitNote: true,
          },
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
      logger.error('Error al obtener reservas', { error, filters })
      throw error
    }
  }

  /**
   * Obtener reservas por item
   */
  async findByItem(
    itemId: string,
    limit: number = 20
  ): Promise<IReservationWithRelations[]> {
    try {
      const reservations = await prisma.reservation.findMany({
        where: { itemId },
        include: {
          item: true,
          exitNote: true,
        },
        take: limit,
      })

      return reservations as unknown as IReservationWithRelations[]
    } catch (error) {
      logger.error('Error al obtener reservas del artículo', {
        error,
        itemId,
      })
      throw error
    }
  }

  /**
   * Obtener reservas por almacén
   */
  async findByWarehouse(
    warehouseId: string,
    limit: number = 20
  ): Promise<IReservationWithRelations[]> {
    try {
      const reservations = await prisma.reservation.findMany({
        where: { warehouseId },
        include: {
          item: true,
          exitNote: true,
        },
        take: limit,
      })

      return reservations as unknown as IReservationWithRelations[]
    } catch (error) {
      logger.error('Error al obtener reservas del almacén', {
        error,
        warehouseId,
      })
      throw error
    }
  }

  /**
   * Obtener reservas activas
   */
  async findActive(limit: number = 20): Promise<IReservationWithRelations[]> {
    try {
      const reservations = await prisma.reservation.findMany({
        where: { status: ReservationStatus.ACTIVE },
        include: {
          item: true,
          exitNote: true,
        },
        take: limit,
      })

      return reservations as unknown as IReservationWithRelations[]
    } catch (error) {
      logger.error('Error al obtener reservas activas', { error })
      throw error
    }
  }

  /**
   * Obtener reservas expiradas
   */
  async findExpired(limit: number = 20): Promise<IReservationWithRelations[]> {
    try {
      const now = new Date()
      const reservations = await prisma.reservation.findMany({
        where: {
          status: ReservationStatus.ACTIVE,
          expiresAt: { lt: now },
        },
        include: {
          item: true,
          exitNote: true,
        },
        take: limit,
      })

      return reservations as unknown as IReservationWithRelations[]
    } catch (error) {
      logger.error('Error al obtener reservas expiradas', { error })
      throw error
    }
  }

  /**
   * Actualizar reserva
   */
  async update(
    id: string,
    data: IUpdateReservationInput,
    userId?: string
  ): Promise<IReservationWithRelations> {
    try {
      const reservation = await prisma.reservation.findUnique({
        where: { id },
      })

      if (!reservation) {
        throw new NotFoundError(INVENTORY_MESSAGES.reservation.notFound)
      }

      // Si se cambia la cantidad, validar stock
      if (data.quantity && data.quantity !== reservation.quantity) {
        const stock = await prisma.stock.findFirst({
          where: {
            itemId: reservation.itemId,
            warehouseId: reservation.warehouseId,
          },
        })

        const currentReservedQuantity = await prisma.reservation.aggregate({
          where: {
            itemId: reservation.itemId,
            warehouseId: reservation.warehouseId,
            id: { not: id },
            status: ReservationStatus.ACTIVE,
          },
          _sum: { quantity: true },
        })

        const reservedSum = currentReservedQuantity._sum.quantity || 0
        const availableForThisReservation =
          (stock?.quantityAvailable || 0) + reservation.quantity

        if (data.quantity > availableForThisReservation) {
          throw new BadRequestError(
            INVENTORY_MESSAGES.stock.insufficientQuantity
          )
        }
      }

      const updated = await prisma.reservation.update({
        where: { id },
        data,
        include: {
          item: true,
          exitNote: true,
        },
      })

      logger.info(`Reserva actualizada: ${id}`, { data })

      return updated as unknown as IReservationWithRelations
    } catch (error) {
      logger.error('Error al actualizar reserva', { error, id, data })
      throw error
    }
  }

  /**
   * Consumir reserva (marcar como entregada)
   */
  async consume(
    reservationId: string,
    quantity?: number,
    deliveredBy?: string,
    userId?: string
  ): Promise<IReservationWithRelations> {
    try {
      const reservation = await prisma.reservation.findUnique({
        where: { id: reservationId },
      })

      if (!reservation) {
        throw new NotFoundError(INVENTORY_MESSAGES.reservation.notFound)
      }

      if (reservation.status !== ReservationStatus.ACTIVE) {
        throw new BadRequestError(
          `No se puede consumir una reserva con estado ${reservation.status}`
        )
      }

      const consumedQuantity = quantity || reservation.quantity
      if (consumedQuantity > reservation.quantity) {
        throw new BadRequestError(
          `Cantidad a consumir (${consumedQuantity}) no puede ser mayor a la reserva (${reservation.quantity})`
        )
      }

      // Si se consume parte de la reserva, crear una nueva para el resto
      if (consumedQuantity < reservation.quantity) {
        const remainingQuantity = reservation.quantity - consumedQuantity
        const count = (await prisma.reservation.count()) + 1
        await prisma.reservation.create({
          data: {
            reservationNumber: `RES-${new Date().getFullYear()}-${String(count).padStart(5, '0')}`,
            itemId: reservation.itemId,
            warehouseId: reservation.warehouseId,
            quantity: remainingQuantity,
            status: ReservationStatus.ACTIVE,
            workOrderId: reservation.workOrderId,
            saleOrderId: reservation.saleOrderId,
            reference: reservation.reference,
            notes: reservation.notes,
            expiresAt: reservation.expiresAt,
            createdBy: userId,
          },
        })
      }

      // FASE 3: Update Stock quantities
      try {
        await prisma.stock.update({
          where: {
            itemId_warehouseId: {
              itemId: reservation.itemId,
              warehouseId: reservation.warehouseId,
            },
          },
          data: {
            quantityReserved: { decrement: consumedQuantity }, // Free up reserved quantity
            quantityConsumed: { increment: consumedQuantity }, // Track consumed quantity
            updatedAt: new Date(),
          },
        })
      } catch (stockError) {
        logger.warn('Error updating stock on consumption', {
          reservationId,
          stockError: (stockError as Error).message,
        })
        // Non-blocking: continue even if stock update fails
      }

      const updated = await prisma.reservation.update({
        where: { id: reservationId },
        data: {
          quantity: consumedQuantity,
          status: ReservationStatus.CONSUMED,
          deliveredAt: new Date(),
          deliveredBy: deliveredBy || userId,
        },
        include: {
          item: true,
          exitNote: true,
        },
      })

      logger.info(`Reserva consumida: ${reservationId}`, {
        quantity: consumedQuantity,
      })

      return updated as unknown as IReservationWithRelations
    } catch (error) {
      logger.error('Error al consumir reserva', { error, reservationId })
      throw error
    }
  }

  /**
   * Liberar reserva
   */
  async release(
    reservationId: string,
    reason?: string,
    userId?: string
  ): Promise<IReservationWithRelations> {
    try {
      const reservation = await prisma.reservation.findUnique({
        where: { id: reservationId },
      })

      if (!reservation) {
        throw new NotFoundError(INVENTORY_MESSAGES.reservation.notFound)
      }

      if (reservation.status !== ReservationStatus.ACTIVE) {
        throw new BadRequestError(
          `No se puede liberar una reserva con estado ${reservation.status}`
        )
      }

      // FASE 3: Update Stock quantities
      try {
        await prisma.stock.update({
          where: {
            itemId_warehouseId: {
              itemId: reservation.itemId,
              warehouseId: reservation.warehouseId,
            },
          },
          data: {
            quantityReserved: { decrement: reservation.quantity }, // Free up reserved quantity
            quantityAvailable: { increment: reservation.quantity }, // Make available again
            updatedAt: new Date(),
          },
        })
      } catch (stockError) {
        logger.warn('Error updating stock on release', {
          reservationId,
          stockError: (stockError as Error).message,
        })
        // Non-blocking: continue even if stock update fails
      }

      const notes = reason
        ? `${reservation.notes || ''}\n[RELEASED] ${reason}`
        : `${reservation.notes || ''}\n[RELEASED]`

      const updated = await prisma.reservation.update({
        where: { id: reservationId },
        data: {
          status: ReservationStatus.RELEASED,
          releasedAt: new Date(),
          notes: notes.trim(),
        },
        include: {
          item: true,
          exitNote: true,
        },
      })

      logger.info(`Reserva liberada: ${reservationId}`, { reason })

      return updated as unknown as IReservationWithRelations
    } catch (error) {
      logger.error('Error al liberar reserva', { error, reservationId })
      throw error
    }
  }

  /**
   * Marcar como pendiente de entrega
   */
  async markAsPendingPickup(
    reservationId: string,
    userId?: string
  ): Promise<IReservationWithRelations> {
    try {
      const reservation = await prisma.reservation.findUnique({
        where: { id: reservationId },
      })

      if (!reservation) {
        throw new NotFoundError(INVENTORY_MESSAGES.reservation.notFound)
      }

      const updated = await prisma.reservation.update({
        where: { id: reservationId },
        data: {
          status: ReservationStatus.PENDING_PICKUP,
        },
        include: {
          item: true,
          exitNote: true,
        },
      })

      logger.info(`Reserva marcada como pendiente: ${reservationId}`)

      return updated as unknown as IReservationWithRelations
    } catch (error) {
      logger.error('Error al marcar reserva como pendiente', {
        error,
        reservationId,
      })
      throw error
    }
  }

  /**
   * Eliminar reserva (solo si no está consumida)
   */
  async delete(id: string, userId?: string): Promise<any> {
    try {
      const reservation = await prisma.reservation.findUnique({
        where: { id },
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

      await prisma.reservation.delete({ where: { id } })

      logger.info(`Reserva eliminada: ${id}`, { userId })

      return { success: true, id }
    } catch (error) {
      logger.error('Error al eliminar reserva', { error, id })
      throw error
    }
  }
}

export default new ReservationService()
