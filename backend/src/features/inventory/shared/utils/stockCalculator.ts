// backend/src/features/inventory/shared/utils/stockCalculator.ts

import { PrismaClient } from '../../../../generated/prisma'

const prisma = new PrismaClient()

export interface StockInfo {
  quantityReal: number
  quantityReserved: number
  quantityAvailable: number
  averageCost: number
}

export interface StockUpdateResult {
  previousStock: StockInfo
  newStock: StockInfo
  difference: number
}

export class StockCalculator {
  /**
   * Calcula el stock disponible
   */
  static calculateAvailable(
    quantityReal: number,
    quantityReserved: number
  ): number {
    return Math.max(0, quantityReal - quantityReserved)
  }

  /**
   * Verifica si hay stock suficiente
   */
  static hasSufficientStock(
    quantityReal: number,
    quantityReserved: number,
    requiredQuantity: number
  ): boolean {
    const available = this.calculateAvailable(quantityReal, quantityReserved)
    return available >= requiredQuantity
  }

  /**
   * Obtiene el stock actual de un artículo en un almacén
   */
  static async getStock(
    itemId: string,
    warehouseId: string
  ): Promise<StockInfo | null> {
    const stock = await prisma.stock.findUnique({
      where: {
        itemId_warehouseId: {
          itemId,
          warehouseId,
        },
      },
    })

    if (!stock) return null

    return {
      quantityReal: stock.quantityReal,
      quantityReserved: stock.quantityReserved,
      quantityAvailable: this.calculateAvailable(
        stock.quantityReal,
        stock.quantityReserved
      ),
      averageCost: Number(stock.averageCost),
    }
  }

  /**
   * Incrementa el stock (entrada)
   */
  static async incrementStock(
    itemId: string,
    warehouseId: string,
    quantity: number,
    unitCost?: number
  ): Promise<StockUpdateResult> {
    const existingStock = await prisma.stock.findUnique({
      where: {
        itemId_warehouseId: { itemId, warehouseId },
      },
    })

    const previousStock: StockInfo = existingStock
      ? {
          quantityReal: existingStock.quantityReal,
          quantityReserved: existingStock.quantityReserved,
          quantityAvailable: this.calculateAvailable(
            existingStock.quantityReal,
            existingStock.quantityReserved
          ),
          averageCost: Number(existingStock.averageCost),
        }
      : {
          quantityReal: 0,
          quantityReserved: 0,
          quantityAvailable: 0,
          averageCost: 0,
        }

    // Calcular nuevo costo promedio
    let newAverageCost = previousStock.averageCost
    if (unitCost !== undefined && unitCost > 0) {
      const totalCost =
        previousStock.quantityReal * previousStock.averageCost +
        quantity * unitCost
      const totalQuantity = previousStock.quantityReal + quantity
      newAverageCost = totalQuantity > 0 ? totalCost / totalQuantity : 0
    }

    const newQuantityReal = previousStock.quantityReal + quantity
    const newQuantityAvailable = this.calculateAvailable(
      newQuantityReal,
      previousStock.quantityReserved
    )

    // Upsert del stock
    const updatedStock = await prisma.stock.upsert({
      where: {
        itemId_warehouseId: { itemId, warehouseId },
      },
      create: {
        itemId,
        warehouseId,
        quantityReal: quantity,
        quantityReserved: 0,
        quantityAvailable: quantity,
        averageCost: unitCost || 0,
        lastMovementAt: new Date(),
      },
      update: {
        quantityReal: newQuantityReal,
        quantityAvailable: newQuantityAvailable,
        averageCost: newAverageCost,
        lastMovementAt: new Date(),
      },
    })

    const newStock: StockInfo = {
      quantityReal: updatedStock.quantityReal,
      quantityReserved: updatedStock.quantityReserved,
      quantityAvailable: updatedStock.quantityAvailable,
      averageCost: Number(updatedStock.averageCost),
    }

    return {
      previousStock,
      newStock,
      difference: quantity,
    }
  }

  /**
   * Decrementa el stock (salida)
   */
  static async decrementStock(
    itemId: string,
    warehouseId: string,
    quantity: number,
    allowNegative: boolean = false
  ): Promise<StockUpdateResult> {
    const existingStock = await prisma.stock.findUnique({
      where: {
        itemId_warehouseId: { itemId, warehouseId },
      },
    })

    if (!existingStock) {
      throw new Error('Stock no encontrado')
    }

    const previousStock: StockInfo = {
      quantityReal: existingStock.quantityReal,
      quantityReserved: existingStock.quantityReserved,
      quantityAvailable: this.calculateAvailable(
        existingStock.quantityReal,
        existingStock.quantityReserved
      ),
      averageCost: Number(existingStock.averageCost),
    }

    const newQuantityReal = previousStock.quantityReal - quantity

    if (!allowNegative && newQuantityReal < 0) {
      throw new Error('Stock insuficiente')
    }

    const newQuantityAvailable = this.calculateAvailable(
      newQuantityReal,
      previousStock.quantityReserved
    )

    const updatedStock = await prisma.stock.update({
      where: {
        itemId_warehouseId: { itemId, warehouseId },
      },
      data: {
        quantityReal: newQuantityReal,
        quantityAvailable: newQuantityAvailable,
        lastMovementAt: new Date(),
      },
    })

    const newStock: StockInfo = {
      quantityReal: updatedStock.quantityReal,
      quantityReserved: updatedStock.quantityReserved,
      quantityAvailable: updatedStock.quantityAvailable,
      averageCost: Number(updatedStock.averageCost),
    }

    return {
      previousStock,
      newStock,
      difference: -quantity,
    }
  }

  /**
   * Reserva stock
   */
  static async reserveStock(
    itemId: string,
    warehouseId: string,
    quantity: number
  ): Promise<StockUpdateResult> {
    const existingStock = await prisma.stock.findUnique({
      where: {
        itemId_warehouseId: { itemId, warehouseId },
      },
    })

    if (!existingStock) {
      throw new Error('Stock no encontrado')
    }

    const previousStock: StockInfo = {
      quantityReal: existingStock.quantityReal,
      quantityReserved: existingStock.quantityReserved,
      quantityAvailable: this.calculateAvailable(
        existingStock.quantityReal,
        existingStock.quantityReserved
      ),
      averageCost: Number(existingStock.averageCost),
    }

    if (
      !this.hasSufficientStock(
        previousStock.quantityReal,
        previousStock.quantityReserved,
        quantity
      )
    ) {
      throw new Error('Stock insuficiente para reservar')
    }

    const newQuantityReserved = previousStock.quantityReserved + quantity
    const newQuantityAvailable = this.calculateAvailable(
      previousStock.quantityReal,
      newQuantityReserved
    )

    const updatedStock = await prisma.stock.update({
      where: {
        itemId_warehouseId: { itemId, warehouseId },
      },
      data: {
        quantityReserved: newQuantityReserved,
        quantityAvailable: newQuantityAvailable,
      },
    })

    const newStock: StockInfo = {
      quantityReal: updatedStock.quantityReal,
      quantityReserved: updatedStock.quantityReserved,
      quantityAvailable: updatedStock.quantityAvailable,
      averageCost: Number(updatedStock.averageCost),
    }

    return {
      previousStock,
      newStock,
      difference: 0,
    }
  }

  /**
   * Libera stock reservado
   */
  static async releaseStock(
    itemId: string,
    warehouseId: string,
    quantity: number
  ): Promise<StockUpdateResult> {
    const existingStock = await prisma.stock.findUnique({
      where: {
        itemId_warehouseId: { itemId, warehouseId },
      },
    })

    if (!existingStock) {
      throw new Error('Stock no encontrado')
    }

    const previousStock: StockInfo = {
      quantityReal: existingStock.quantityReal,
      quantityReserved: existingStock.quantityReserved,
      quantityAvailable: this.calculateAvailable(
        existingStock.quantityReal,
        existingStock.quantityReserved
      ),
      averageCost: Number(existingStock.averageCost),
    }

    const newQuantityReserved = Math.max(
      0,
      previousStock.quantityReserved - quantity
    )
    const newQuantityAvailable = this.calculateAvailable(
      previousStock.quantityReal,
      newQuantityReserved
    )

    const updatedStock = await prisma.stock.update({
      where: {
        itemId_warehouseId: { itemId, warehouseId },
      },
      data: {
        quantityReserved: newQuantityReserved,
        quantityAvailable: newQuantityAvailable,
      },
    })

    const newStock: StockInfo = {
      quantityReal: updatedStock.quantityReal,
      quantityReserved: updatedStock.quantityReserved,
      quantityAvailable: updatedStock.quantityAvailable,
      averageCost: Number(updatedStock.averageCost),
    }

    return {
      previousStock,
      newStock,
      difference: 0,
    }
  }

  /**
   * Verifica alertas de stock
   */
  static async checkStockAlerts(
    itemId: string,
    warehouseId: string
  ): Promise<string[]> {
    const alerts: string[] = []

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: {
        name: true,
        minStock: true,
        maxStock: true,
        reorderPoint: true,
      },
    })

    const stock = await this.getStock(itemId, warehouseId)

    if (!item || !stock) return alerts

    // Sin stock
    if (stock.quantityAvailable === 0) {
      alerts.push(`Sin stock para ${item.name}`)
    }
    // Stock bajo
    else if (stock.quantityAvailable <= item.minStock) {
      alerts.push(
        `Stock bajo para ${item.name}. Cantidad: ${stock.quantityAvailable}, Mínimo: ${item.minStock}`
      )
    }
    // Punto de reorden
    else if (stock.quantityAvailable <= item.reorderPoint) {
      alerts.push(
        `Stock alcanzó punto de reorden para ${item.name}. Cantidad: ${stock.quantityAvailable}`
      )
    }

    // Exceso de stock
    if (item.maxStock && stock.quantityReal > item.maxStock) {
      alerts.push(
        `Exceso de stock para ${item.name}. Cantidad: ${stock.quantityReal}, Máximo: ${item.maxStock}`
      )
    }

    return alerts
  }

  /**
   * Obtiene el valor total del stock
   */
  static async getStockValue(
    itemId: string,
    warehouseId: string
  ): Promise<number> {
    const stock = await this.getStock(itemId, warehouseId)
    if (!stock) return 0

    return stock.quantityReal * stock.averageCost
  }

  /**
   * Obtiene el valor total del inventario de un almacén
   */
  static async getWarehouseTotalValue(warehouseId: string): Promise<number> {
    const stocks = await prisma.stock.findMany({
      where: { warehouseId },
    })

    return stocks.reduce((total, stock) => {
      return total + stock.quantityReal * Number(stock.averageCost)
    }, 0)
  }
}
