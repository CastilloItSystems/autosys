/**
 * Hooks System Exports and Initialization
 */

export * from './hook.interface.js'
export { default as HookRegistry } from './hook.registry.js'

export * from './stock.hooks.js'
export * from './adjustment.hooks.js'
export * from './item.hooks.js'

import { initializeStockHooks } from './stock.hooks.js'
import { initializeAdjustmentHooks } from './adjustment.hooks.js'
import { initializeItemHooks } from './item.hooks.js'

/**
 * Initialize all hooks in the system
 */
export const initializeHooks = (): void => {
  initializeStockHooks()
  initializeAdjustmentHooks()
  initializeItemHooks()
}
