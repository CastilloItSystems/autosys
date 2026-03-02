/**
 * Stock Hooks - Automatic behaviors for stock operations
 */

import { logger } from '../../../shared/utils/logger';
import { HookType, HookStage, IHookContext } from './hook.interface';
import HookRegistry from './hook.registry';

const hookRegistry = HookRegistry.getInstance();

/**
 * After Stock Create: Automatically create initial Movement record
 */
export const afterStockCreate = async (context: IHookContext): Promise<void> => {
  try {
    if (!context.data?.stockId || !context.data?.itemId) {
      return;
    }

    logger.info('Stock created, triggering movement creation', {
      stockId: context.data.stockId,
      itemId: context.data.itemId,
    });

    // Note: Actual Movement creation happens in stock.service.ts
    // This hook just logs/triggers side effects
  } catch (error) {
    logger.error('Error in afterStockCreate hook', { error });
    throw error;
  }
};

/**
 * Before Stock Reserve: Validate sufficient quantity available
 */
export const beforeStockReserve = async (context: IHookContext): Promise<void> => {
  try {
    const { quantityToReserve, currentAvailable } = context.data || {};

    if (!quantityToReserve || !currentAvailable) {
      return;
    }

    // Soft validation - will be hard validated in service
    if (quantityToReserve > currentAvailable) {
      logger.warn('Stock reserve quantity exceeds available', {
        requested: quantityToReserve,
        available: currentAvailable,
        stockId: context.entityId,
      });
    }
  } catch (error) {
    logger.error('Error in beforeStockReserve hook', { error });
    throw error;
  }
};

/**
 * After Stock Update: Log quantity changes for audit
 */
export const afterStockUpdate = async (context: IHookContext): Promise<void> => {
  try {
    const { oldQuantity, newQuantity, changeReason } = context.data || {};

    if (oldQuantity !== undefined && newQuantity !== undefined) {
      const delta = newQuantity - oldQuantity;
      const changeType = delta > 0 ? 'INCREASE' : delta < 0 ? 'DECREASE' : 'NO_CHANGE';

      logger.info('Stock quantity updated', {
        stockId: context.entityId,
        delta,
        changeType,
        reason: changeReason,
      });
    }
  } catch (error) {
    logger.error('Error in afterStockUpdate hook', { error });
    // Don't throw - this is a logging hook
  }
};

/**
 * Initialize all stock hooks
 */
export const initializeStockHooks = (): void => {
  hookRegistry.register(
    HookType.STOCK_CREATE,
    HookStage.AFTER,
    afterStockCreate,
    10
  );

  hookRegistry.register(
    HookType.STOCK_RESERVE,
    HookStage.BEFORE,
    beforeStockReserve,
    20
  );

  hookRegistry.register(
    HookType.STOCK_UPDATE,
    HookStage.AFTER,
    afterStockUpdate,
    5
  );

  logger.info('Stock hooks initialized');
};
