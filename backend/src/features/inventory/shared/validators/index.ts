/**
 * Shared Validators Index
 */

export { commonValidators } from './common.validator.js'
export { movementValidators } from './movement.validator.js'
export { stockValidators } from './stock.validator.js'

export default {
  common: require('./common.validator').commonValidators,
  movement: require('./movement.validator').movementValidators,
  stock: require('./stock.validator').stockValidators,
}
