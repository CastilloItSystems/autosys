/**
 * Events Module Index
 * Centralizes all inventory event handlers registration
 */

import {
  registerStockEventHandlers,
  unregisterStockEventHandlers,
} from './stock.events'
import {
  registerMovementEventHandlers,
  unregisterMovementEventHandlers,
} from './movement.events'
import {
  registerPurchaseEventHandlers,
  unregisterPurchaseEventHandlers,
} from './purchase.events'
import {
  registerReservationEventHandlers,
  unregisterReservationEventHandlers,
} from './reservation.events'

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
} from './stock.events'
export {
  registerMovementEventHandlers,
  unregisterMovementEventHandlers,
} from './movement.events'
export {
  registerPurchaseEventHandlers,
  unregisterPurchaseEventHandlers,
} from './purchase.events'
export {
  registerReservationEventHandlers,
  unregisterReservationEventHandlers,
} from './reservation.events'

export default {
  registerAllEventHandlers,
  unregisterAllEventHandlers,
}
