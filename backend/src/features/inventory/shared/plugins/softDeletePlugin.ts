/**
 * Soft Delete Plugin - Prisma Middleware for logical deletion
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaMiddlewareParams = any
import { logger } from '../../../../shared/utils/logger.js'

interface SoftDeleteConfig {
  models: string[]
  deletedAtField: string
  isDeletedField: string
}

/**
 * Models that support soft delete
 */
const SOFT_DELETE_MODELS = [
  'Item',
  'Warehouse',
  'Stock',
  'Movement',
  'Batch',
  'SerialNumber',
  'ExitNote',
]

const DEFAULT_CONFIG: SoftDeleteConfig = {
  models: SOFT_DELETE_MODELS,
  deletedAtField: 'deletedAt',
  isDeletedField: 'isDeleted',
}

/**
 * Create soft delete middleware for Prisma
 */
export function createSoftDeleteMiddleware(
  config: Partial<SoftDeleteConfig> = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  return async (
    params: PrismaMiddlewareParams,
    next: (params: PrismaMiddlewareParams) => Promise<any>
  ) => {
    const { model, action, args } = params

    // Check if model supports soft delete
    if (!model || !finalConfig.models.includes(model)) {
      return next(params)
    }

    // Handle delete operations
    if (action === 'delete') {
      // Convert delete to update with soft delete flag
      const updateParams: PrismaMiddlewareParams = {
        ...params,
        action: 'update',
        args: {
          where: args.where,
          data: {
            [finalConfig.isDeletedField]: true,
            [finalConfig.deletedAtField]: new Date(),
          },
        },
      }
      logger.info(`[SOFT_DELETE] ${model} - converted delete to soft delete`)
      return next(updateParams)
    }

    // Handle deleteMany operations
    if (action === 'deleteMany') {
      const updateParams: PrismaMiddlewareParams = {
        ...params,
        action: 'updateMany',
        args: {
          where: args.where,
          data: {
            [finalConfig.isDeletedField]: true,
            [finalConfig.deletedAtField]: new Date(),
          },
        },
      }
      logger.info(
        `[SOFT_DELETE] ${model} - converted deleteMany to updateMany with soft delete`
      )
      return next(updateParams)
    }

    // Exclude soft deleted records from findUnique/findMany
    if (action === 'findUnique' || action === 'findFirst') {
      const whereCondition = {
        AND: [args.where || {}, { [finalConfig.isDeletedField]: false }],
      }

      return next({
        ...params,
        args: {
          ...args,
          where: whereCondition,
        },
      })
    }

    if (action === 'findMany') {
      const whereCondition = {
        AND: [args.where || {}, { [finalConfig.isDeletedField]: false }],
      }

      return next({
        ...params,
        args: {
          ...args,
          where: whereCondition,
        },
      })
    }

    // Handle count
    if (action === 'count') {
      return next({
        ...params,
        args: {
          ...args,
          where: {
            AND: [args.where || {}, { [finalConfig.isDeletedField]: false }],
          },
        },
      })
    }

    // Regular operations
    return next(params)
  }
}

/**
 * Initialize soft delete for Prisma client
 */
export function initializeSoftDelete(
  client: any,
  config: Partial<SoftDeleteConfig> = {}
): void {
  try {
    client.$use(createSoftDeleteMiddleware(config))
    logger.info(
      `Soft delete initialized for models: ${(config.models || DEFAULT_CONFIG.models).join(', ')}`
    )
  } catch (error) {
    logger.error('Failed to initialize soft delete:', error)
  }
}

/**
 * Permanently delete a record (hard delete)
 */
export async function hardDelete<T>(model: any, where: any): Promise<T> {
  // Direct query to delete without middleware
  logger.warn(`[HARD_DELETE] Permanently deleting record:`, where)
  return model.delete({ where })
}

/**
 * Restore soft deleted record
 */
export async function restoreRecord(
  model: any,
  where: any,
  deletedAtField: string = 'deletedAt',
  isDeletedField: string = 'isDeleted'
): Promise<any> {
  logger.info(`[RESTORE] Restoring soft deleted record:`, where)
  return model.update({
    where,
    data: {
      [isDeletedField]: false,
      [deletedAtField]: null,
    },
  })
}

/**
 * Get soft deleted records
 */
export async function getSoftDeletedRecords(
  model: any,
  where: any = {},
  isDeletedField: string = 'isDeleted'
): Promise<any[]> {
  logger.info(`Fetching soft deleted records from ${model.name}`)
  return model.findMany({
    where: {
      ...where,
      [isDeletedField]: true,
    },
  })
}

/**
 * Purge old soft deleted records (older than specified days)
 */
export async function purgeSoftDeleted(
  model: any,
  olderThanDays: number,
  deletedAtField: string = 'deletedAt',
  isDeletedField: string = 'isDeleted'
): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

  logger.warn(
    `[PURGE] Permanently deleting soft-deleted records older than ${olderThanDays} days`
  )

  const result = await model.deleteMany({
    where: {
      [isDeletedField]: true,
      [deletedAtField]: { lt: cutoffDate },
    },
  })

  logger.info(`[PURGE] Deleted ${result.count} records`)
  return result.count
}

export default {
  createSoftDeleteMiddleware,
  initializeSoftDelete,
  hardDelete,
  restoreRecord,
  getSoftDeletedRecords,
  purgeSoftDeleted,
}
