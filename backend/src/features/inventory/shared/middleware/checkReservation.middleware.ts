// backend/src/features/inventory/shared/middleware/checkReservation.middleware.ts

import { Request, Response, NextFunction } from 'express'
import { asyncHandler } from '../../../../shared/middleware/asyncHandler.middleware'
import {
  BadRequestError,
  NotFoundError,
} from '../../../../shared/utils/apiError'
import prisma from '../../../../services/prisma.service'

/**
 * Middleware para validar que la reserva existe y está activa
 */
export const validateReservation = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const reservationId =
      req.params.id || req.params.reservationId || req.body.reservationId

    if (!reservationId) {
      throw new BadRequestError('ID de reserva es requerido')
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId as string },
      include: {
        item: {
          select: {
            name: true,
            sku: true,
          },
        },
      },
    })

    if (!reservation) {
      throw new NotFoundError('Reserva no encontrada')
    }

    // Adjuntar al request
    req.body.reservation = reservation

    next()
  }
)

/**
 * Middleware para validar que la reserva puede ser consumida
 */
export const validateReservationForConsumption = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const reservationId = req.params.id || req.body.reservationId

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId as string },
      include: {
        item: true,
      },
    })

    if (!reservation) {
      throw new NotFoundError('Reserva no encontrada')
    }

    if (reservation.status === 'CONSUMED') {
      throw new BadRequestError('La reserva ya fue consumida')
    }

    if (reservation.status === 'RELEASED') {
      throw new BadRequestError('La reserva fue liberada')
    }

    // Verificar si expiró
    if (reservation.expiresAt && reservation.expiresAt < new Date()) {
      throw new BadRequestError('La reserva ha expirado')
    }

    req.body.reservation = reservation

    next()
  }
)

/**
 * Middleware para validar que la reserva puede ser liberada
 */
export const validateReservationForRelease = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const reservationId = req.params.id || req.body.reservationId

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId as string },
    })

    if (!reservation) {
      throw new NotFoundError('Reserva no encontrada')
    }

    if (reservation.status === 'CONSUMED') {
      throw new BadRequestError('No se puede liberar una reserva consumida')
    }

    if (reservation.status === 'RELEASED') {
      throw new BadRequestError('La reserva ya fue liberada')
    }

    req.body.reservation = reservation

    next()
  }
)

/**
 * Middleware para verificar reservas expiradas
 */
export const checkExpiredReservations = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Este middleware puede ejecutarse periódicamente o en operaciones específicas
    const expiredReservations = await prisma.reservation.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: {
          lt: new Date(),
        },
      },
    })

    if (expiredReservations.length > 0) {
      // Actualizar estado a RELEASED
      await prisma.reservation.updateMany({
        where: {
          id: {
            in: expiredReservations.map((r) => r.id),
          },
        },
        data: {
          status: 'RELEASED',
          releasedAt: new Date(),
        },
      })

      // Liberar stock
      for (const reservation of expiredReservations) {
        await prisma.stock.update({
          where: {
            itemId_warehouseId: {
              itemId: reservation.itemId,
              warehouseId: reservation.warehouseId,
            },
          },
          data: {
            quantityReserved: {
              decrement: reservation.quantity,
            },
            quantityAvailable: {
              increment: reservation.quantity,
            },
          },
        })
      }
    }

    next()
  }
)
