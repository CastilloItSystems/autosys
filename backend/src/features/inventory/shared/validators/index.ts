/**
 * Shared Validators Index
 */

export { commonValidators } from './common.validator'
export { movementValidators } from './movement.validator'
export { stockValidators } from './stock.validator'

export default {
  common: require('./common.validator').commonValidators,
  movement: require('./movement.validator').movementValidators,
  stock: require('./stock.validator').stockValidators,
}
