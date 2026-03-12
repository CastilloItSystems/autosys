/**
 * Item Hooks - Behaviors for item operations
 */

import { logger } from '../../../shared/utils/logger.js'
import { HookType, HookStage, IHookContext } from './hook.interface.js'
import HookRegistry from './hook.registry.js'

const hookRegistry = HookRegistry.getInstance()

/**
 * Before Item Delete: Validate item has no active stock
 */
export const beforeItemDelete = async (
  context: IHookContext
): Promise<void> => {
  try {
    const { hasActiveStock, hasMovements } = context.data || {}

    if (hasActiveStock) {
      throw new Error(
        'Cannot delete item with active stock records. Transfer or adjust stock first.'
      )
    }

    if (hasMovements) {
      logger.warn('Deleting item with movement history', {
        itemId: context.entityId,
      })
    }
  } catch (error) {
    logger.error('Error in beforeItemDelete hook', { error })
    throw error
  }
}

/**
 * After Item Create: Initialize default values if needed
 */
export const afterItemCreate = async (context: IHookContext): Promise<void> => {
  try {
    const { sku, name } = context.data || {}

    logger.info('Item created', {
      itemId: context.entityId,
      sku,
      name,
    })

    // Could trigger additional setup (categories, pricing, etc.)
  } catch (error) {
    logger.error('Error in afterItemCreate hook', { error })
  }
}

/**
 * Before Item Update: Validate critical field changes
 */
export const beforeItemUpdate = async (
  context: IHookContext
): Promise<void> => {
  try {
    const { changes } = context.data || {}

    if (!changes) {
      return
    }

    // Warn if SKU is being changed
    if (changes.sku && changes.oldSku) {
      logger.warn('Item SKU changed', {
        itemId: context.entityId,
        oldSku: changes.oldSku,
        newSku: changes.sku,
      })
    }

    // Warn if unit is being changed with existing stock
    if (changes.unitId && changes.hasStock) {
      logger.warn('Item unit changed with existing stock', {
        itemId: context.entityId,
      })
    }
  } catch (error) {
    logger.error('Error in beforeItemUpdate hook', { error })
    throw error
  }
}

/**
 * Initialize all item hooks
 */
export const initializeItemHooks = (): void => {
  hookRegistry.register(
    HookType.ITEM_DELETE,
    HookStage.BEFORE,
    beforeItemDelete,
    20
  )

  hookRegistry.register(
    HookType.ITEM_CREATE,
    HookStage.AFTER,
    afterItemCreate,
    5
  )

  hookRegistry.register(
    HookType.ITEM_UPDATE,
    HookStage.BEFORE,
    beforeItemUpdate,
    10
  )

  logger.info('Item hooks initialized')
}
