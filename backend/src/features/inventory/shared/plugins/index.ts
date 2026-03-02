/**
 * Shared Plugins Index
 */

export {
  createAuditMiddleware,
  initializeAuditTracking,
  getAuditLog,
  exportAuditLogs,
} from './auditPlugin'

export {
  createSoftDeleteMiddleware,
  initializeSoftDelete,
  hardDelete,
  restoreRecord,
  getSoftDeletedRecords,
  purgeSoftDeleted,
} from './softDeletePlugin'

export default {
  audit: require('./auditPlugin'),
  softDelete: require('./softDeletePlugin'),
}
