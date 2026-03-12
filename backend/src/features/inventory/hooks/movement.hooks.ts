/**
 * Movement Hooks
 * Pre and post-processing hooks for inventory movements
 */

import prisma from '../../../services/prisma.service.js'
import { HookRegistry } from '../shared/hooks/hook.registry.js'
import { EventService } from '../../../shared/events/event.service.js'
import { EventType } from '../../../shared/types/event.types.js'

const eventService = EventService.getInstance()
const hookRegistry = HookRegistry.getInstance()

/**
 * Pre-movement validation hooks
 */

export const preMovementValidation = {
  /**
   * Validate sufficient stock before outgoing movements
   */
  async validateOutgoingStock(context: any): Promise<void> {
    const { itemId, warehouseId, quantity, movementType } = context

    if (
      !['SALE', 'EXIT_NOTE', 'TRANSFER_OUT', 'WRITE_OFF'].includes(movementType)
    ) {
      return // Only validate for outgoing movements
    }

    const stock = await prisma.stock.findUnique({
      where: {
        itemId_warehouseId: {
          itemId,
          warehouseId,
        },
      },
    })

    if (!stock || stock.quantityAvailable < quantity) {
      throw new Error(
        `Insufficient stock: Available ${stock?.quantityAvailable || 0}, Requested ${quantity}`
      )
    }
  },

  /**
   * Validate item exists and is active
   */
  async validateItem(context: any): Promise<void> {
    const { itemId } = context

    const item = await prisma.item.findUnique({
      where: { id: itemId },
    })

    if (!item) {
      throw new Error(`Item ${itemId} not found`)
    }

    if (!(item as any).isActive) {
      throw new Error(`Item ${item.name} is inactive and cannot be moved`)
    }
  },

  /**
   * Validate warehouse exists
   */
  async validateWarehouse(context: any): Promise<void> {
    const { warehouseId } = context

    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId },
    })

    if (!warehouse) {
      throw new Error(`Warehouse ${warehouseId} not found`)
    }

    if (!(warehouse as any).isActive) {
      throw new Error(`Warehouse ${warehouse.name} is inactive`)
    }
  },

  /**
   * Check for audit requirements based on movement type
   */
  async validateAuditRequirements(context: any): Promise<void> {
    const { movementType, quantity, itemId } = context

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: { auditRequired: true },
    })

    // High-value or audit-required items
    if (
      (item as any)?.auditRequired &&
      ['WRITE_OFF', 'ADJUSTMENT_OUT'].includes(movementType)
    ) {
      if (!context.auditApprovalId) {
        throw new Error(
          `Audit approval required for ${movementType} of high-value item`
        )
      }
    }
  },
}

/**
 * Post-movement hooks
 */

export const postMovementHooks = {
  /**
   * Update stock quantities after movement
   */
  async updateStock(context: any): Promise<void> {
    const { itemId, warehouseId, quantity, movementType } = context

    const quantityChange = [
      'TRANSFER_IN',
      'PURCHASE_IN',
      'RETURN_IN',
      'ADJUSTMENT_IN',
    ].includes(movementType)
      ? quantity
      : -quantity

    await prisma.stock.updateMany({
      where: { itemId, warehouseId },
      data: {
        quantityReal: { increment: quantityChange },
        updatedAt: new Date(),
      },
    })
  },

  /**
   * Create audit trail entry
   */
  async createAuditTrail(context: any): Promise<void> {
    const { movementId, createdBy, movementType, reference, notes } = context

    // Create audit record (if audit table exists)
    console.log(
      `📝 Movement audit: ${movementType} - ${reference} created by ${createdBy}`
    )

    // Emit event for audit logging
    eventService.emit(EventType.MOVEMENT_AUDIT_CREATED, {
      movementId,
      movementType,
      createdBy,
      timestamp: new Date(),
    })
  },

  /**
   * Check stock level thresholds after movement
   */
  async checkStockThreshold(context: any): Promise<void> {
    const { itemId, warehouseId, quantity, movementType } = context

    // Only check for outgoing movements
    if (
      !['SALE', 'EXIT_NOTE', 'TRANSFER_OUT', 'WRITE_OFF'].includes(movementType)
    ) {
      return
    }

    const stock = await prisma.stock.findUnique({
      where: {
        itemId_warehouseId: {
          itemId,
          warehouseId,
        },
      },
    })

    const item = await prisma.item.findUnique({
      where: { id: itemId },
    })

    if (stock && item) {
      const minStock = (item as any).minStock || 10

      // Trigger alert if below minimum
      if (stock.quantityAvailable <= minStock) {
        eventService.emit(EventType.LOW_STOCK_ALERT, {
          itemId,
          itemName: item.name,
          warehouseId,
          currentQuantity: stock.quantityAvailable,
          minStock,
          timestamp: new Date(),
        })
      }
    }
  },

  /**
   * Update last movement date for item
   */
  async updateLastMovementDate(context: any): Promise<void> {
    const { itemId } = context

    await prisma.item.updateMany({
      where: { id: itemId },
      data: {
        lastMovementDate: new Date(),
      },
    })
  },

  /**
   * Generate analytics metrics
   */
  async generateMetrics(context: any): Promise<void> {
    const { itemId, warehouseId, quantity, movementType } = context

    // Track movement metrics (could store in analytics table)
    console.log(
      `📊 Movement metrics: ${quantity} units of ${itemId} - ${movementType}`
    )

    eventService.emit(EventType.MOVEMENT_METRICS_RECORDED, {
      movementType,
      quantity,
      itemId,
      warehouseId,
      timestamp: new Date(),
    })
  },
}

/**
 * Register all movement hooks
 */
export function registerMovementHooks(): void {
  console.log('🪝 Registering movement hooks...')

  // Pre-movement validations
  hookRegistry.registerHook(
    'movement:before:create',
    'validate-outgoing-stock',
    preMovementValidation.validateOutgoingStock
  )
  hookRegistry.registerHook(
    'movement:before:create',
    'validate-item',
    preMovementValidation.validateItem
  )
  hookRegistry.registerHook(
    'movement:before:create',
    'validate-warehouse',
    preMovementValidation.validateWarehouse
  )
  hookRegistry.registerHook(
    'movement:before:create',
    'validate-audit',
    preMovementValidation.validateAuditRequirements
  )

  // Post-movement actions
  hookRegistry.registerHook(
    'movement:after:create',
    'update-stock',
    postMovementHooks.updateStock
  )
  hookRegistry.registerHook(
    'movement:after:create',
    'audit-trail',
    postMovementHooks.createAuditTrail
  )
  hookRegistry.registerHook(
    'movement:after:create',
    'check-threshold',
    postMovementHooks.checkStockThreshold
  )
  hookRegistry.registerHook(
    'movement:after:create',
    'update-last-movement',
    postMovementHooks.updateLastMovementDate
  )
  hookRegistry.registerHook(
    'movement:after:create',
    'generate-metrics',
    postMovementHooks.generateMetrics
  )

  console.log('✅ Movement hooks registered')
}

/**
 * Execute pre-movement hooks
 */
export async function executePreMovementHooks(context: any): Promise<void> {
  const hooks = hookRegistry.getHooks('movement:before:create')

  for (const hook of hooks) {
    try {
      await hook(context)
    } catch (error) {
      console.error(`Error executing pre-movement hook ${hook.name}:`, error)
      throw error // Re-throw to prevent movement
    }
  }
}

/**
 * Execute post-movement hooks
 */
export async function executePostMovementHooks(context: any): Promise<void> {
  const hooks = hookRegistry.getHooks('movement:after:create')

  for (const hook of hooks) {
    try {
      await hook(context)
    } catch (error) {
      console.error(`Error executing post-movement hook ${hook.name}:`, error)
      // Don't re-throw - movement already created, just log error
    }
  }
}

export default {
  preMovementValidation,
  postMovementHooks,
  registerMovementHooks,
  executePreMovementHooks,
  executePostMovementHooks,
}
