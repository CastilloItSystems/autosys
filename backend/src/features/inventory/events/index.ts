/**
 * Events Module Index
 * Centralizes all inventory event handlers registration
 */

import {
  registerStockEventHandlers,
  unregisterStockEventHandlers,
} from './stock.events.js'
import {
  registerMovementEventHandlers,
  unregisterMovementEventHandlers,
} from './movement.events.js'
import {
  registerPurchaseEventHandlers,
  unregisterPurchaseEventHandlers,
} from './purchase.events.js'
import {
  registerReservationEventHandlers,
  unregisterReservationEventHandlers,
} from './reservation.events.js'

/**
 * Register all inventory event handlers
 */
export function registerAllEventHandlers(): void {
  console.log('🔔 Initializing inventory event handlers...')

  try {
    registerStockEventHandlers()
    console.log('✅ Stock event handlers registered')
  } catch (error) {
    console.error('❌ Error registering stock event handlers:', error)
  }

  try {
    registerMovementEventHandlers()
    console.log('✅ Movement event handlers registered')
  } catch (error) {
    console.error('❌ Error registering movement event handlers:', error)
  }

  try {
    registerPurchaseEventHandlers()
    console.log('✅ Purchase event handlers registered')
  } catch (error) {
    console.error('❌ Error registering purchase event handlers:', error)
  }

  try {
    registerReservationEventHandlers()
    console.log('✅ Reservation event handlers registered')
  } catch (error) {
    console.error('❌ Error registering reservation event handlers:', error)
  }

  console.log('🔔 All inventory event handlers initialized')
}

/**
 * Unregister all inventory event handlers
 */
export function unregisterAllEventHandlers(): void {
  console.log('🔔 Unregistering all inventory event handlers...')

  unregisterStockEventHandlers()
  unregisterMovementEventHandlers()
  unregisterPurchaseEventHandlers()
  unregisterReservationEventHandlers()

  console.log('✅ All inventory event handlers unregistered')
}

// Export individual handlers for granular control
export {
  registerStockEventHandlers,
  unregisterStockEventHandlers,
} from './stock.events.js'
export {
  registerMovementEventHandlers,
  unregisterMovementEventHandlers,
} from './movement.events.js'
export {
  registerPurchaseEventHandlers,
  unregisterPurchaseEventHandlers,
} from './purchase.events.js'
export {
  registerReservationEventHandlers,
  unregisterReservationEventHandlers,
} from './reservation.events.js'

export default {
  registerAllEventHandlers,
  unregisterAllEventHandlers,
}
