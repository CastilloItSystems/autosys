/**
 * Workshop Integration Service
 * Handles work order material consumption and tracking
 */

import { prisma } from '../../../../config/database'
import {
  EventService,
  EventType,
} from '../../../../shared/services/event.service'
import { BadRequestError, NotFoundError } from '../../../../shared/utils/errors'
import { logger } from '../../../../shared/utils/logger'

interface WorkOrderMaterialConsumption {
  workOrderId: string
  itemId: string
  itemSku: string
  itemName: string
  plannedQuantity: number
  consumedQuantity: number
  remainingQuantity: number
  wasteQuantity: number
  unitCost: number
  totalCost: number
  costVariance: number
  efficiency: number
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED'
}

interface WorkOrderMaterialSummary {
  workOrderId: string
  status: string
  totalPlannedCost: number
  totalActualCost: number
  costVariance: number
  variancePercentage: number
  wastagePercentage: number
  efficiency: number
  materialsCount: number
  materials: WorkOrderMaterialConsumption[]
}

interface MaterialRequirement {
  itemId: string
  itemSku: string
  itemName: string
  quantity: number
  unitCost: number
  totalCost: number
  warehouse: string
  availableQuantity: number
  shortfall: number
}

class WorkshopIntegrationService {
  private static instance: WorkshopIntegrationService

  public static getInstance(): WorkshopIntegrationService {
    if (!WorkshopIntegrationService.instance) {
      WorkshopIntegrationService.instance = new WorkshopIntegrationService()
    }
    return WorkshopIntegrationService.instance
  }

  /**
   * Create material consumption record for work order
   */
  async recordMaterialConsumption(
    workOrderId: string,
    itemId: string,
    quantity: number,
    wasteQuantity: number = 0
  ): Promise<WorkOrderMaterialConsumption> {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { stock: true },
    })

    if (!item) throw new NotFoundError('Item not found')

    // Check stock availability
    const totalStock = item.stock.reduce(
      (sum, s) => sum + s.quantityAvailable,
      0
    )
    if (totalStock < quantity) {
      throw new BadRequestError(
        `Insufficient stock for item ${item.sku}. Required: ${quantity}, Available: ${totalStock}`
      )
    }

    // Create movement for material consumption
    const movement = await prisma.movement.create({
      data: {
        type: 'WORK_ORDER_CONSUMPTION',
        itemId,
        quantity,
        warehouseId: item.stock[0]?.warehouseId || '',
        referenceId: workOrderId,
        notes: `Work order ${workOrderId} material consumption`,
      },
    })

    // Calculate costs
    const totalCost = quantity * (item.costPrice || 0)
    const plannedQuantity = quantity + wasteQuantity
    const remainingQuantity = Math.max(0, plannedQuantity - quantity)
    const costVariance = wasteQuantity * (item.costPrice || 0)

    // Calculate efficiency (actual vs planned)
    const efficiency =
      plannedQuantity > 0 ? (quantity / plannedQuantity) * 100 : 100

    // Emit material consumed event
    EventService.getInstance().emit(EventType.MATERIAL_CONSUMED, {
      workOrderId,
      itemId,
      quantity,
      movementId,
      cost: totalCost,
    })

    return {
      workOrderId,
      itemId,
      itemSku: item.sku,
      itemName: item.name,
      plannedQuantity,
      consumedQuantity: quantity,
      remainingQuantity,
      wasteQuantity,
      unitCost: item.costPrice || 0,
      totalCost: Math.round(totalCost * 100) / 100,
      costVariance: Math.round(costVariance * 100) / 100,
      efficiency: Math.round(efficiency * 100) / 100,
      status: 'IN_PROGRESS',
    }
  }

  /**
   * Get material summary for work order
   */
  async getWorkOrderMaterialSummary(
    workOrderId: string
  ): Promise<WorkOrderMaterialSummary> {
    // Get all movements for this work order
    const movements = await prisma.movement.findMany({
      where: {
        referenceId: workOrderId,
        type: 'WORK_ORDER_CONSUMPTION',
      },
      include: { item: true },
    })

    let totalPlannedCost = 0
    let totalActualCost = 0
    let totalWaste = 0
    let totalPlanned = 0
    let totalConsumed = 0

    const materials: WorkOrderMaterialConsumption[] = await Promise.all(
      movements.map(async (mov) => {
        const plannedQuantity = mov.quantity // Simplified - should include waste
        const wasteQuantity = 0 // Placeholder
        const totalCost = mov.quantity * (mov.item.costPrice || 0)
        const efficiency =
          plannedQuantity > 0 ? (mov.quantity / plannedQuantity) * 100 : 100

        totalPlannedCost += plannedQuantity * (mov.item.costPrice || 0)
        totalActualCost += totalCost
        totalWaste += wasteQuantity
        totalPlanned += plannedQuantity
        totalConsumed += mov.quantity

        return {
          workOrderId,
          itemId: mov.itemId,
          itemSku: mov.item.sku,
          itemName: mov.item.name,
          plannedQuantity,
          consumedQuantity: mov.quantity,
          remainingQuantity: Math.max(0, plannedQuantity - mov.quantity),
          wasteQuantity,
          unitCost: mov.item.costPrice || 0,
          totalCost: Math.round(totalCost * 100) / 100,
          costVariance:
            Math.round(wasteQuantity * (mov.item.costPrice || 0) * 100) / 100,
          efficiency: Math.round(efficiency * 100) / 100,
          status: 'IN_PROGRESS' as const,
        }
      })
    )

    const costVariance =
      Math.round((totalPlannedCost - totalActualCost) * 100) / 100
    const variancePercentage =
      totalPlannedCost > 0
        ? Math.round((costVariance / totalPlannedCost) * 100 * 100) / 100
        : 0
    const wastagePercentage =
      totalPlanned > 0
        ? Math.round((totalWaste / totalPlanned) * 100 * 100) / 100
        : 0
    const efficiency =
      totalPlanned > 0
        ? Math.round((totalConsumed / totalPlanned) * 100 * 100) / 100
        : 100

    return {
      workOrderId,
      status: 'IN_PROGRESS',
      totalPlannedCost: Math.round(totalPlannedCost * 100) / 100,
      totalActualCost: Math.round(totalActualCost * 100) / 100,
      costVariance,
      variancePercentage,
      wastagePercentage,
      efficiency,
      materialsCount: materials.length,
      materials,
    }
  }

  /**
   * Check material requirements for work order
   */
  async checkMaterialRequirements(
    materials: { itemId: string; quantity: number }[]
  ): Promise<{
    isFeasible: boolean
    requirements: MaterialRequirement[]
    shortfalls: MaterialRequirement[]
  }> {
    const requirements: MaterialRequirement[] = []
    const shortfalls: MaterialRequirement[] = []

    await Promise.all(
      materials.map(async (mat) => {
        const item = await prisma.item.findUnique({
          where: { id: mat.itemId },
          include: { stock: true },
        })

        if (!item) {
          throw new NotFoundError(`Item ${mat.itemId} not found`)
        }

        const availableQuantity = item.stock.reduce(
          (sum, s) => sum + s.quantityAvailable,
          0
        )
        const shortfall = Math.max(0, mat.quantity - availableQuantity)
        const totalCost = mat.quantity * (item.costPrice || 0)

        const requirement: MaterialRequirement = {
          itemId: item.id,
          itemSku: item.sku,
          itemName: item.name,
          quantity: mat.quantity,
          unitCost: item.costPrice || 0,
          totalCost: Math.round(totalCost * 100) / 100,
          warehouse: item.stock[0]?.warehouse?.name || 'Unknown',
          availableQuantity,
          shortfall,
        }

        requirements.push(requirement)
        if (shortfall > 0) {
          shortfalls.push(requirement)
        }
      })
    )

    return {
      isFeasible: shortfalls.length === 0,
      requirements,
      shortfalls,
    }
  }

  /**
   * Complete work order and record final consumption
   */
  async completeWorkOrder(
    workOrderId: string,
    finalNotes?: string
  ): Promise<void> {
    const movements = await prisma.movement.findMany({
      where: {
        referenceId: workOrderId,
        type: 'WORK_ORDER_CONSUMPTION',
      },
    })

    // Mark all movements as completed
    await Promise.all(
      movements.map((mov) =>
        prisma.movement.update({
          where: { id: mov.id },
          data: { notes: finalNotes || mov.notes },
        })
      )
    )

    // Emit work order completed event
    EventService.getInstance().emit(EventType.WORK_ORDER_COMPLETED, {
      workOrderId,
      materialsCount: movements.length,
      completedAt: new Date(),
    })
  }

  /**
   * Get work order consumption history
   */
  async getWorkOrderConsumptionHistory(
    page: number = 1,
    limit: number = 50
  ): Promise<{ data: any[]; total: number }> {
    const skip = (page - 1) * limit

    const movements = await prisma.movement.findMany({
      where: { type: 'WORK_ORDER_CONSUMPTION' },
      include: { item: true },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    const total = await prisma.movement.count({
      where: { type: 'WORK_ORDER_CONSUMPTION' },
    })

    return {
      data: movements.map((mov) => ({
        movementId: mov.id,
        workOrderId: mov.referenceId,
        itemSku: mov.item.sku,
        itemName: mov.item.name,
        quantity: mov.quantity,
        cost: mov.quantity * (mov.item.costPrice || 0),
        createdAt: mov.createdAt,
      })),
      total,
    }
  }
}

export const recordMaterialConsumption = (
  workOrderId: string,
  itemId: string,
  quantity: number,
  wasteQuantity?: number
) =>
  WorkshopIntegrationService.getInstance().recordMaterialConsumption(
    workOrderId,
    itemId,
    quantity,
    wasteQuantity
  )

export const getWorkOrderMaterialSummary = (workOrderId: string) =>
  WorkshopIntegrationService.getInstance().getWorkOrderMaterialSummary(
    workOrderId
  )

export const checkMaterialRequirements = (
  materials: { itemId: string; quantity: number }[]
) =>
  WorkshopIntegrationService.getInstance().checkMaterialRequirements(materials)

export const completeWorkOrder = (workOrderId: string, finalNotes?: string) =>
  WorkshopIntegrationService.getInstance().completeWorkOrder(
    workOrderId,
    finalNotes
  )

export const getWorkOrderConsumptionHistory = (page?: number, limit?: number) =>
  WorkshopIntegrationService.getInstance().getWorkOrderConsumptionHistory(
    page,
    limit
  )

export default WorkshopIntegrationService
