// backend/src/features/inventory/shared/utils/batchHelper.ts

import prisma from '../../../../services/prisma.service.js'
import { DateHelper } from '../../../../shared/utils/dateHelper.js'

export interface BatchInfo {
  id: string
  batchNumber: string
  expiryDate: Date | null
  currentQuantity: number
  isExpired: boolean
  isExpiringSoon: boolean
  daysUntilExpiry: number | null
}

export class BatchHelper {
  static readonly EXPIRING_SOON_DAYS = 30

  /**
   * Genera número de lote único
   */
  static generateBatchNumber(itemSku: string): string {
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0')

    return `${itemSku}-${year}${month}${day}-${random}`
  }

  /**
   * Verifica si un lote está vencido
   */
  static isExpired(expiryDate: Date): boolean {
    return DateHelper.isExpired(expiryDate)
  }

  /**
   * Verifica si un lote está próximo a vencer
   */
  static isExpiringSoon(
    expiryDate: Date,
    daysThreshold: number = this.EXPIRING_SOON_DAYS
  ): boolean {
    return DateHelper.isExpiringSoon(expiryDate, daysThreshold)
  }

  /**
   * Obtiene días hasta el vencimiento
   */
  static getDaysUntilExpiry(expiryDate: Date): number {
    return DateHelper.daysBetween(new Date(), expiryDate)
  }

  /**
   * Obtiene información del lote
   */
  static async getBatchInfo(batchId: string): Promise<BatchInfo | null> {
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
    })

    if (!batch) return null

    const expiryDate = batch.expiryDate
    let isExpired = false
    let isExpiringSoon = false
    let daysUntilExpiry: number | null = null

    if (expiryDate) {
      isExpired = this.isExpired(expiryDate)
      isExpiringSoon = !isExpired && this.isExpiringSoon(expiryDate)
      daysUntilExpiry = this.getDaysUntilExpiry(expiryDate)
    }

    return {
      id: batch.id,
      batchNumber: batch.batchNumber,
      expiryDate,
      currentQuantity: batch.currentQuantity,
      isExpired,
      isExpiringSoon,
      daysUntilExpiry,
    }
  }

  /**
   * Obtiene lotes disponibles para un item (FEFO - First Expired, First Out)
   */
  static async getAvailableBatches(itemId: string): Promise<BatchInfo[]> {
    const batches = await prisma.batch.findMany({
      where: {
        itemId,
        isActive: true,
        currentQuantity: {
          gt: 0,
        },
      },
      orderBy: [
        { expiryDate: 'asc' }, // Primero los que vencen antes
        { manufacturingDate: 'asc' },
      ],
    })

    return Promise.all(
      batches.map(async (batch) => {
        const info = await this.getBatchInfo(batch.id)
        return info!
      })
    )
  }

  /**
   * Selecciona el mejor lote para usar (FEFO)
   */
  static async selectBatchForUse(
    itemId: string,
    requiredQuantity: number
  ): Promise<string | null> {
    const batches = await this.getAvailableBatches(itemId)

    // Filtrar lotes no vencidos
    const validBatches = batches.filter((b) => !b.isExpired)

    // Buscar un lote con suficiente cantidad
    const batch = validBatches.find(
      (b) => b.currentQuantity >= requiredQuantity
    )

    return batch?.id || null
  }

  /**
   * Obtiene lotes vencidos
   */
  static async getExpiredBatches(itemId?: string): Promise<BatchInfo[]> {
    const where: any = {
      isActive: true,
      expiryDate: {
        lt: new Date(),
      },
    }

    if (itemId) {
      where.itemId = itemId
    }

    const batches = await prisma.batch.findMany({ where })

    return Promise.all(
      batches.map(async (batch) => {
        const info = await this.getBatchInfo(batch.id)
        return info!
      })
    )
  }

  /**
   * Obtiene lotes próximos a vencer
   */
  static async getExpiringSoonBatches(
    itemId?: string,
    daysThreshold: number = this.EXPIRING_SOON_DAYS
  ): Promise<BatchInfo[]> {
    const thresholdDate = DateHelper.addDays(new Date(), daysThreshold)

    const where: any = {
      isActive: true,
      expiryDate: {
        gte: new Date(),
        lte: thresholdDate,
      },
    }

    if (itemId) {
      where.itemId = itemId
    }

    const batches = await prisma.batch.findMany({ where })

    return Promise.all(
      batches.map(async (batch) => {
        const info = await this.getBatchInfo(batch.id)
        return info!
      })
    )
  }
}
