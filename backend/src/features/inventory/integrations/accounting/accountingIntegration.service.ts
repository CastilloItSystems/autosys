/**
 * Accounting Integration Service
 * Handles GL posting and cost allocation to accounting system
 */

import { prisma } from '../../../../config/database'
import { EventService, EventType } from '../../../../services/event.service'
import { BadRequestError, NotFoundError } from '../../../../shared/utils/errors'
import { logger } from '../../../../shared/utils/logger'

interface GLEntry {
  account: string
  debit: number
  credit: number
  description: string
  reference: string
}

interface AllocationResult {
  movementId: string
  totalAmount: number
  allocations: {
    costCenterId: string
    departmentId: string
    amount: number
    percentage: number
  }[]
  glEntries: GLEntry[]
  postedAt: Date
}

class AccountingIntegrationService {
  private static instance: AccountingIntegrationService

  public static getInstance(): AccountingIntegrationService {
    if (!AccountingIntegrationService.instance) {
      AccountingIntegrationService.instance = new AccountingIntegrationService()
    }
    return AccountingIntegrationService.instance
  }

  /**
   * Post stock movement to GL (General Ledger)
   */
  async postMovementToGL(movementId: string): Promise<GLEntry[]> {
    const movement = await prisma.movement.findUnique({
      where: { id: movementId },
      include: {
        item: true,
        fromWarehouse: true,
        toWarehouse: true,
      },
    })

    if (!movement) throw new NotFoundError('Movement not found')

    const glEntries: GLEntry[] = []
    const amount = movement.quantity * (movement.item.costPrice || 0)

    // Map movement types to GL accounts
    const glAccountMap: { [key: string]: { debit: string; credit: string } } = {
      PURCHASE_IN: {
        debit: '1010', // Inventory Asset
        credit: '2010', // Accounts Payable
      },
      SALE: {
        debit: '5010', // COGS
        credit: '1010', // Inventory Asset
      },
      TRANSFER_OUT: {
        debit: '1010-FROM', // Inventory Asset - From Location
        credit: '1010-TO', // Inventory Asset - To Location
      },
      TRANSFER_IN: {
        debit: '1010', // Inventory Asset
        credit: '1010', // Inventory Asset
      },
      RETURN_IN: {
        debit: '1010', // Inventory Asset
        credit: '2010', // Accounts Payable
      },
      WRITE_OFF: {
        debit: '6010', // Loss on Disposal
        credit: '1010', // Inventory Asset
      },
      ADJUSTMENT_IN: {
        debit: '1010', // Inventory Asset
        credit: '6020', // Adjustment Gain
      },
      ADJUSTMENT_OUT: {
        debit: '6020', // Adjustment Loss
        credit: '1010', // Inventory Asset
      },
    }

    const accounts = glAccountMap[movement.type]
    if (!accounts) {
      logger.warn(`No GL mapping for movement type: ${movement.type}`)
      return []
    }

    // Create GL entries
    if (movement.type === 'TRANSFER_OUT' || movement.type === 'TRANSFER_IN') {
      // Inter-warehouse transfer - both debit and credit to inventory
      glEntries.push({
        account: '1010-FROM',
        debit: 0,
        credit: amount,
        description: `Inventory Transfer Out - ${movement.item.name}`,
        reference: movementId,
      })
      glEntries.push({
        account: '1010-TO',
        debit: amount,
        credit: 0,
        description: `Inventory Transfer In - ${movement.item.name}`,
        reference: movementId,
      })
    } else {
      // Standard debit/credit entry
      glEntries.push({
        account: accounts.debit,
        debit: amount,
        credit: 0,
        description: `${movement.type} - ${movement.item.name}`,
        reference: movementId,
      })
      glEntries.push({
        account: accounts.credit,
        debit: 0,
        credit: amount,
        description: `${movement.type} - ${movement.item.name}`,
        reference: movementId,
      })
    }

    // Emit GL posted event
    EventService.getInstance().emit(EventType.GL_POSTED, {
      movementId,
      amount,
      entriesCount: glEntries.length,
    })

    return glEntries
  }

  /**
   * Allocate inventory cost to cost centers
   */
  async allocateCostToCostCenters(
    movementId: string
  ): Promise<AllocationResult> {
    const movement = await prisma.movement.findUnique({
      where: { id: movementId },
      include: {
        item: true,
      },
    })

    if (!movement) throw new NotFoundError('Movement not found')

    const totalAmount = movement.quantity * (movement.item.costPrice || 0)

    // Get cost center allocation rules (simplified - not using actual DB yet)
    const allocations: AllocationResult['allocations'] = []

    // Example allocation logic - should integrate with actual CLS modules
    // For now, using default allocations
    const defaultAllocations = [
      { costCenterId: 'CC-001', departmentId: 'DEPT-001', percentage: 30 },
      { costCenterId: 'CC-002', departmentId: 'DEPT-002', percentage: 40 },
      { costCenterId: 'CC-003', departmentId: 'DEPT-003', percentage: 30 },
    ]

    defaultAllocations.forEach((alloc) => {
      const amount = (totalAmount * alloc.percentage) / 100
      allocations.push({
        costCenterId: alloc.costCenterId,
        departmentId: alloc.departmentId,
        amount: Math.round(amount * 100) / 100,
        percentage: alloc.percentage,
      })
    })

    // Generate GL entries for allocations
    const glEntries: GLEntry[] = []
    allocations.forEach((alloc) => {
      glEntries.push({
        account: `7010-${alloc.costCenterId}`, // Cost Center account
        debit: alloc.amount,
        credit: 0,
        description: `Cost Allocation - ${alloc.departmentId}`,
        reference: movementId,
      })
    })

    // Add offsetting credit
    glEntries.push({
      account: '1010',
      debit: 0,
      credit: totalAmount,
      description: 'Cost Allocation - Total',
      reference: movementId,
    })

    // Emit cost allocated event
    EventService.getInstance().emit(EventType.COST_ALLOCATED, {
      movementId,
      totalAmount,
      allocationsCount: allocations.length,
    })

    return {
      movementId,
      totalAmount: Math.round(totalAmount * 100) / 100,
      allocations,
      glEntries,
      postedAt: new Date(),
    }
  }

  /**
   * Get cost by cost center
   */
  async getCostByCostCenter(
    startDate: Date,
    endDate: Date
  ): Promise<{ costCenterId: string; totalCost: number }[]> {
    const movements = await prisma.movement.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        type: { in: ['SALE', 'TRANSFER_OUT', 'WRITE_OFF'] },
      },
      include: { item: true },
    })

    // Calculate costs by category (simplified cost center mapping)
    const costByCenter: { [key: string]: number } = {}

    movements.forEach((mov) => {
      const cost = mov.quantity * (mov.item.costPrice || 0)
      const center = `CC-${mov.item.categoryId?.slice(0, 3) || '001'}`
      costByCenter[center] = (costByCenter[center] || 0) + cost
    })

    return Object.entries(costByCenter).map(([costCenterId, totalCost]) => ({
      costCenterId,
      totalCost: Math.round(totalCost * 100) / 100,
    }))
  }

  /**
   * Get inventory valuation for financial reporting
   */
  async getInventoryValuation(): Promise<{
    totalValue: number
    byWarehouse: { warehouseId: string; warehouseName: string; value: number }[]
    byCategory: { categoryId: string; categoryName: string; value: number }[]
  }> {
    const stocks = await prisma.stock.findMany({
      include: {
        item: {
          include: { category: true },
        },
        warehouse: true,
      },
    })

    let totalValue = 0
    const byWarehouse: { [key: string]: { name: string; value: number } } = {}
    const byCategory: { [key: string]: { name: string; value: number } } = {}

    stocks.forEach((stock) => {
      const value = stock.quantityReal * (stock.item.costPrice || 0)
      totalValue += value

      // Group by warehouse
      if (!byWarehouse[stock.warehouseId]) {
        byWarehouse[stock.warehouseId] = {
          name: stock.warehouse.name,
          value: 0,
        }
      }
      byWarehouse[stock.warehouseId].value += value

      // Group by category
      if (!byCategory[stock.item.categoryId]) {
        byCategory[stock.item.categoryId] = {
          name: stock.item.category?.name || 'Unknown',
          value: 0,
        }
      }
      byCategory[stock.item.categoryId].value += value
    })

    return {
      totalValue: Math.round(totalValue * 100) / 100,
      byWarehouse: Object.entries(byWarehouse).map(([warehouseId, data]) => ({
        warehouseId,
        warehouseName: data.name,
        value: Math.round(data.value * 100) / 100,
      })),
      byCategory: Object.entries(byCategory).map(([categoryId, data]) => ({
        categoryId,
        categoryName: data.name,
        value: Math.round(data.value * 100) / 100,
      })),
    }
  }
}

export const postMovementToGL = (movementId: string) =>
  AccountingIntegrationService.getInstance().postMovementToGL(movementId)

export const allocateCostToCostCenters = (movementId: string) =>
  AccountingIntegrationService.getInstance().allocateCostToCostCenters(
    movementId
  )

export const getCostByCostCenter = (startDate: Date, endDate: Date) =>
  AccountingIntegrationService.getInstance().getCostByCostCenter(
    startDate,
    endDate
  )

export const getInventoryValuation = () =>
  AccountingIntegrationService.getInstance().getInventoryValuation()

export default AccountingIntegrationService
