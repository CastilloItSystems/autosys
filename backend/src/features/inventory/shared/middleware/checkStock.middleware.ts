// backend/src/features/inventory/shared/middleware/checkStock.middleware.ts

import { Request, Response, NextFunction } from 'express'
import { asyncHandler } from '../../../../shared/middleware/asyncHandler.middleware'
import { BadRequestError } from '../../../../shared/utils/apiError'
import { StockCalculator } from '../utils/stockCalculator'
import prisma from '../../../../services/prisma.service'

interface StockCheckItem {
  itemId: string
  quantity: number
  warehouseId: string
}

/**
 * Middleware para verificar stock antes de procesar una operación
 */
export const checkStock = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const items: StockCheckItem[] = req.body.items || []

    if (!items || items.length === 0) {
      return next()
    }

    const insufficientItems: string[] = []

    for (const item of items) {
      const { itemId, quantity, warehouseId } = item

      // Obtener información del item
      const itemData = await prisma.item.findUnique({
        where: { id: itemId },
        select: {
          name: true,
          allowNegativeStock: true,
        },
      })

      if (!itemData) {
        throw new BadRequestError(`Artículo con ID ${itemId} no encontrado`)
      }

      // Si permite stock negativo, continuar
      if (itemData.allowNegativeStock) {
        continue
      }

      // Verificar stock
      const stock = await StockCalculator.getStock(itemId, warehouseId)

      if (!stock) {
        insufficientItems.push(`${itemData.name} (sin stock registrado)`)
        continue
      }

      if (
        !StockCalculator.hasSufficientStock(
          stock.quantityReal,
          stock.quantityReserved,
          quantity
        )
      ) {
        insufficientItems.push(
          `${itemData.name} (Disponible: ${stock.quantityAvailable}, Requerido: ${quantity})`
        )
      }
    }

    if (insufficientItems.length > 0) {
      throw new BadRequestError(
        'Stock insuficiente para los siguientes artículos',
        insufficientItems
      )
    }

    next()
  }
)

/**
 * Middleware para verificar stock de un solo item
 */
export const checkSingleItemStock = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { itemId, quantity, warehouseId } = req.body

    if (!itemId || !quantity || !warehouseId) {
      return next()
    }

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: {
        name: true,
        allowNegativeStock: true,
      },
    })

    if (!item) {
      throw new BadRequestError('Artículo no encontrado')
    }

    if (item.allowNegativeStock) {
      return next()
    }

    const stock = await StockCalculator.getStock(itemId, warehouseId)

    if (!stock) {
      throw new BadRequestError(
        `No hay stock registrado para ${item.name} en este almacén`
      )
    }

    if (
      !StockCalculator.hasSufficientStock(
        stock.quantityReal,
        stock.quantityReserved,
        quantity
      )
    ) {
      throw new BadRequestError(
        `Stock insuficiente para ${item.name}. Disponible: ${stock.quantityAvailable}, Requerido: ${quantity}`
      )
    }

    next()
  }
)

/**
 * Middleware para verificar stock antes de crear una reserva
 */
export const checkStockForReservation = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { itemId, quantity, warehouseId } = req.body

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: { name: true },
    })

    if (!item) {
      throw new BadRequestError('Artículo no encontrado')
    }

    const stock = await StockCalculator.getStock(itemId, warehouseId)

    if (!stock) {
      throw new BadRequestError(
        `No hay stock para ${item.name} en este almacén`
      )
    }

    if (
      !StockCalculator.hasSufficientStock(
        stock.quantityReal,
        stock.quantityReserved,
        quantity
      )
    ) {
      throw new BadRequestError(
        `Stock insuficiente para reservar ${item.name}. Disponible: ${stock.quantityAvailable}, Requerido: ${quantity}`
      )
    }

    next()
  }
)
