/**
 * Adjustment Hooks - Behaviors for adjustment operations
 */

import { logger } from '../../../shared/utils/logger.js'
import { HookType, HookStage, IHookContext } from './hook.interface.js'
import HookRegistry from './hook.registry.js'
import { EventType } from '../shared/events/event.types.js'
import EventService from '../shared/events/event.service.js'

const hookRegistry = HookRegistry.getInstance()
const eventService = EventService.getInstance()

/**
 * After Adjustment Apply: Create audit trail Movement and check for large deltas
 */
export const afterAdjustmentApply = async (
  context: IHookContext
): Promise<void> => {
  try {
    const { adjustmentId, items, warehouseId, totalDelta } = context.data || {}

    if (!adjustmentId || !items) {
      return
    }

    logger.info('Adjustment applied, creating audit log', {
      adjustmentId,
      warehouseId,
      itemCount: items.length,
      totalDelta,
    })

    // Alert if large delta (e.g., >20% variance)
    if (totalDelta && Math.abs(totalDelta) > 20) {
      await eventService.emit({
        type: EventType.SYSTEM_ALERT,
        entityId: adjustmentId,
        entityType: 'adjustment',
        userId: context.userId || 'SYSTEM',
        data: {
          message: 'Large adjustment delta detected',
          percentageChange: totalDelta,
          items: items.length,
          warehouseId,
        },
      })

      logger.warn('Large adjustment delta alert', {
        adjustmentId,
        delta: totalDelta,
      })
    }
  } catch (error) {
    logger.error('Error in afterAdjustmentApply hook', { error })
    // Don't throw - AFTER hooks shouldn't block
  }
}

/**
 * After Adjustment Reject: Log rejection reason for audit
 */
export const afterAdjustmentReject = async (
  context: IHookContext
): Promise<void> => {
  try {
    const { adjustmentId, reason } = context.data || {}

    if (!adjustmentId) {
      return
    }

    logger.info('Adjustment rejected', {
      adjustmentId,
      reason,
      rejectedBy: context.userId,
    })

    // Could emit event for notifications
    await eventService.emit({
      type: EventType.ADJUSTMENT_REJECTED,
      entityId: adjustmentId,
      entityType: 'adjustment',
      userId: context.userId || 'SYSTEM',
      data: { reason },
    })
  } catch (error) {
    logger.error('Error in afterAdjustmentReject hook', { error })
  }
}

/**
 * Before Adjustment Approve: Validate all items have proper documentation
 */
export const beforeAdjustmentApprove = async (
  context: IHookContext
): Promise<void> => {
  try {
    const { items, reason } = context.data || {}

    if (!items || items.length === 0) {
      throw new Error('Adjustment has no items to approve')
    }

    if (!reason || reason.trim().length === 0) {
      throw new Error('Adjustment approval requires a reason')
    }

    const undocumentedItems = items.filter(
      (item: any) => !item.notes && item.quantityChange < 0
    )

    if (undocumentedItems.length > 0) {
      logger.warn('Undocumented negative adjustments', {
        count: undocumentedItems.length,
        adjustmentId: context.entityId,
      })
      // Note: We don't throw - could be configured as warning vs error
    }
  } catch (error) {
    logger.error('Error in beforeAdjustmentApprove hook', { error })
    throw error
  }
}

/**
 * Initialize all adjustment hooks
 */
export const initializeAdjustmentHooks = (): void => {
  hookRegistry.register(
    HookType.ADJUSTMENT_APPLY,
    HookStage.AFTER,
    afterAdjustmentApply,
    10
  )

  hookRegistry.register(
    HookType.ADJUSTMENT_REJECT,
    HookStage.AFTER,
    afterAdjustmentReject,
    5
  )

  hookRegistry.register(
    HookType.ADJUSTMENT_APPROVE,
    HookStage.BEFORE,
    beforeAdjustmentApprove,
    15
  )

  logger.info('Adjustment hooks initialized')
}
