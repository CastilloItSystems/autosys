/**
 * Shared Plugins Index
 */

export {
  createAuditMiddleware,
  initializeAuditTracking,
  getAuditLog,
  exportAuditLogs,
} from './auditPlugin.js'

export {
  createSoftDeleteMiddleware,
  initializeSoftDelete,
  hardDelete,
  restoreRecord,
  getSoftDeletedRecords,
  purgeSoftDeleted,
} from './softDeletePlugin.js'

export default {
  audit: require('./auditPlugin'),
  softDelete: require('./softDeletePlugin'),
}
