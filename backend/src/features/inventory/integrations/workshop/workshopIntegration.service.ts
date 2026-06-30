/**
 * Workshop Integration Service
 * Handles work order material consumption and tracking
 */

import { PrismaClient, Prisma } from '../../../../generated/prisma/client.js'
import { EventType } from '../../shared/events/event.types.js'

import {
  BadRequestError,
  NotFoundError,
} from '../../../../shared/utils/errors.js'
import { logger } from '../../../../shared/utils/logger.js'
import EventService from '../../shared/events/event.service.js'
import movementService from '../../movements/movements.service.js'
import { MovementType } from '../../movements/movements.interface.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

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
   * Create material consumption record for work order.
   *
   * Discounts real stock atomically and creates the corresponding inventory
   * movement. Stock decrement is delegated to MovementService.create(), which
   * runs inside a $transaction, validates item/warehouse by empresaId, checks
   * availability in the SPECIFIC warehouse and decrements
   * Stock.quantityReal/quantityAvailable accordingly.
   */
  async recordMaterialConsumption(
    workOrderId: string,
    itemId: string,
    quantity: number,
    wasteQuantity: number = 0,
    userId: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<WorkOrderMaterialConsumption> {
    if (!(quantity > 0)) {
      throw new BadRequestError('La cantidad consumida debe ser mayor a cero')
    }

    const item = await (db as PrismaClient).item.findFirst({
      where: { id: itemId, empresaId },
      include: { stocks: true },
    })

    if (!item) throw new NotFoundError('Artículo no encontrado')

    // Pick a single warehouse that can satisfy the full consumption in ONE
    // location (movements decrement from a single warehouseFromId). We never
    // validate against the global sum while discounting from one warehouse.
    const sourceStock = item.stocks
      .filter((s) => s.quantityAvailable >= quantity)
      .sort((a, b) => b.quantityAvailable - a.quantityAvailable)[0]

    if (!sourceStock) {
      const totalAvailable = item.stocks.reduce(
        (sum, s) => sum + s.quantityAvailable,
        0
      )
      throw new BadRequestError(
        `Stock insuficiente para el artículo ${item.sku}. ` +
          `Requerido en un único almacén: ${quantity}, ` +
          `Disponible (total entre almacenes): ${totalAvailable}`
      )
    }

    const unitCost = Number(item.costPrice) || 0
    const totalCost = quantity * unitCost

    // Delegate the atomic stock decrement + movement creation to the canonical
    // MovementService. It runs in its own $transaction (or joins the provided
    // tx) and throws BadRequestError on insufficient stock in the warehouse.
    const movement = await movementService.create(
      {
        type: MovementType.ADJUSTMENT_OUT,
        itemId,
        quantity,
        unitCost,
        totalCost,
        warehouseFromId: sourceStock.warehouseId,
        workOrderId,
        reference: workOrderId,
        notes: `Consumo de materiales OT ${workOrderId}`,
      },
      userId,
      empresaId,
      db
    )

    const plannedQuantity = quantity + wasteQuantity
    const remainingQuantity = Math.max(0, plannedQuantity - quantity)
    const costVariance = wasteQuantity * unitCost
    const efficiency =
      plannedQuantity > 0 ? (quantity / plannedQuantity) * 100 : 100

    EventService.getInstance().emit({
      type: EventType.MATERIAL_CONSUMED,
      entityId: workOrderId,
      entityType: 'WORK_ORDER',
      data: {
        workOrderId,
        itemId,
        quantity,
        movementId: movement.id,
        cost: totalCost,
        empresaId,
      },
    })

    logger.info(`Consumo de materiales registrado: OT ${workOrderId}`, {
      userId,
      empresaId,
      itemId,
      quantity,
      movementId: movement.id,
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
      unitCost,
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
    workOrderId: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<WorkOrderMaterialSummary> {
    // Get all consumption movements for this work order (tenant scoped via item)
    const movements = await (db as PrismaClient).movement.findMany({
      where: {
        reference: workOrderId,
        type: 'ADJUSTMENT_OUT',
        item: { empresaId },
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
        const itemUnitCost = Number(mov.item.costPrice) || 0
        const totalCost = mov.quantity * itemUnitCost
        const efficiency =
          plannedQuantity > 0 ? (mov.quantity / plannedQuantity) * 100 : 100

        totalPlannedCost += plannedQuantity * itemUnitCost
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
          unitCost: itemUnitCost,
          totalCost: Math.round(totalCost * 100) / 100,
          costVariance: Math.round(wasteQuantity * itemUnitCost * 100) / 100,
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
    materials: { itemId: string; quantity: number }[],
    empresaId: string,
    db: PrismaClientType
  ): Promise<{
    isFeasible: boolean
    requirements: MaterialRequirement[]
    shortfalls: MaterialRequirement[]
  }> {
    const requirements: MaterialRequirement[] = []
    const shortfalls: MaterialRequirement[] = []

    await Promise.all(
      materials.map(async (mat) => {
        const item = await (db as PrismaClient).item.findFirst({
          where: { id: mat.itemId, empresaId },
          include: { stocks: true },
        })

        if (!item) {
          throw new NotFoundError(`Artículo ${mat.itemId} no encontrado`)
        }

        const availableQuantity = item.stocks.reduce(
          (sum, s) => sum + s.quantityAvailable,
          0
        )
        const shortfall = Math.max(0, mat.quantity - availableQuantity)
        const matUnitCost = Number(item.costPrice) || 0
        const totalCost = mat.quantity * matUnitCost

        const requirement: MaterialRequirement = {
          itemId: item.id,
          itemSku: item.sku,
          itemName: item.name,
          quantity: mat.quantity,
          unitCost: matUnitCost,
          totalCost: Math.round(totalCost * 100) / 100,
          warehouse: item.stocks[0]?.warehouseId || 'Unknown',
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
    empresaId: string,
    db: PrismaClientType,
    finalNotes?: string
  ): Promise<void> {
    const movements = await (db as PrismaClient).movement.findMany({
      where: {
        reference: workOrderId,
        type: 'ADJUSTMENT_OUT',
        item: { empresaId },
      },
    })

    // Mark all movements as completed (tenant scoped by id from query above)
    await Promise.all(
      movements.map((mov) =>
        (db as PrismaClient).movement.update({
          where: { id: mov.id },
          data: { notes: finalNotes || mov.notes },
        })
      )
    )

    EventService.getInstance().emit({
      type: EventType.WORK_ORDER_COMPLETED,
      entityId: workOrderId,
      entityType: 'WORK_ORDER',
      data: {
        workOrderId,
        materialsCount: movements.length,
        completedAt: new Date(),
        empresaId,
      },
    })
  }

  /**
   * Get work order consumption history
   */
  async getWorkOrderConsumptionHistory(
    empresaId: string,
    db: PrismaClientType,
    page: number = 1,
    limit: number = 50
  ): Promise<{ data: any[]; total: number }> {
    const skip = (page - 1) * limit
    const where = { type: 'ADJUSTMENT_OUT' as const, item: { empresaId } }

    const [movements, total] = await Promise.all([
      (db as PrismaClient).movement.findMany({
        where,
        include: { item: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      (db as PrismaClient).movement.count({ where }),
    ])

    return {
      data: movements.map((mov) => ({
        movementId: mov.id,
        workOrderId: mov.reference,
        itemSku: mov.item.sku,
        itemName: mov.item.name,
        quantity: mov.quantity,
        cost: mov.quantity * (Number(mov.item.costPrice) || 0),
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
  wasteQuantity: number | undefined,
  userId: string,
  empresaId: string,
  db: PrismaClientType
) =>
  WorkshopIntegrationService.getInstance().recordMaterialConsumption(
    workOrderId,
    itemId,
    quantity,
    wasteQuantity ?? 0,
    userId,
    empresaId,
    db
  )

export const getWorkOrderMaterialSummary = (
  workOrderId: string,
  empresaId: string,
  db: PrismaClientType
) =>
  WorkshopIntegrationService.getInstance().getWorkOrderMaterialSummary(
    workOrderId,
    empresaId,
    db
  )

export const checkMaterialRequirements = (
  materials: { itemId: string; quantity: number }[],
  empresaId: string,
  db: PrismaClientType
) =>
  WorkshopIntegrationService.getInstance().checkMaterialRequirements(
    materials,
    empresaId,
    db
  )

export const completeWorkOrder = (
  workOrderId: string,
  empresaId: string,
  db: PrismaClientType,
  finalNotes?: string
) =>
  WorkshopIntegrationService.getInstance().completeWorkOrder(
    workOrderId,
    empresaId,
    db,
    finalNotes
  )

export const getWorkOrderConsumptionHistory = (
  empresaId: string,
  db: PrismaClientType,
  page?: number,
  limit?: number
) =>
  WorkshopIntegrationService.getInstance().getWorkOrderConsumptionHistory(
    empresaId,
    db,
    page,
    limit
  )

export default WorkshopIntegrationService
