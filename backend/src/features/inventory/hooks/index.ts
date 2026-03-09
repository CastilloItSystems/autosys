/**
 * Hooks System Exports and Initialization
 */

export * from './hook.interface'
export { default as HookRegistry } from './hook.registry'

export * from './stock.hooks'
export * from './adjustment.hooks'
export * from './item.hooks'

import { initializeStockHooks } from './stock.hooks'
import { initializeAdjustmentHooks } from './adjustment.hooks'
import { initializeItemHooks } from './item.hooks'

/**
 * Initialize all hooks in the system
 */
export const initializeHooks = (): void => {
  initializeStockHooks()
  initializeAdjustmentHooks()
  initializeItemHooks()
}
