import { Prisma, PrismaClient } from '../generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import { getAuditContext } from '../shared/audit/auditContext.js'
import { logger } from '../shared/utils/logger.js'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined')
}

const adapter = new PrismaPg({ connectionString })

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

const basePrisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = basePrisma
}

const AUDITED_ACTIONS = new Set([
  'create',
  'update',
  'delete',
  'createMany',
  'updateMany',
  'deleteMany',
])

const EXCLUDED_AUDIT_MODELS = new Set([
  'auditLog',
  'entryNote',
  'entryNoteItem',
  'itemSupplier',
  'movement',
  'notification',
  'notificationCompanyPolicy',
  'notificationMembershipPreference',
  'notificationDelivery',
  'purchaseOrderItem',
  'stock',
])

const SENSITIVE_KEY_PATTERN =
  /password|pass|token|secret|credential|authorization|cookie|data_password/i

function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactValue)
  if (value && typeof value === 'object') {
    if (value instanceof Date) return value.toISOString()

    const input = value as Record<string, unknown>
    return Object.fromEntries(
      Object.entries(input)
        .filter(([, val]) => val !== undefined)
        .map(([key, val]) => [
          key,
          SENSITIVE_KEY_PATTERN.test(key) ? '[REDACTED]' : redactValue(val),
        ])
    )
  }
  if (typeof value === 'bigint') return value.toString()
  return value
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(redactValue(value))) as Prisma.InputJsonValue
}

function getEntityId(result: unknown, args: any): string {
  if (result && typeof result === 'object' && 'id' in result) {
    const id = (result as { id?: unknown }).id
    if (id != null) return String(id)
  }
  if (args?.where?.id != null) return String(args.where.id)
  return 'bulk'
}

function getDelegateName(model: string): string {
  return model ? model.charAt(0).toLowerCase() + model.slice(1) : model
}

async function getBeforeSnapshot(model: string, action: string, args: any) {
  if (!['update', 'delete'].includes(action)) return null
  if (!args?.where) return null

  const delegate = (basePrisma as any)[getDelegateName(model)]
  if (!delegate?.findUnique) return null

  try {
    return await delegate.findUnique({ where: args.where })
  } catch {
    return null
  }
}

async function writeAuditLog(params: {
  model: string
  action: string
  args: any
  result: unknown
  before: unknown
}) {
  const context = getAuditContext()
  if (!context) return
  if (EXCLUDED_AUDIT_MODELS.has(getDelegateName(params.model))) return

  try {
    await basePrisma.auditLog.create({
      data: {
        entity: params.model,
        entityId: getEntityId(params.result, params.args),
        action: params.action.toUpperCase(),
        userId: context.userId,
        empresaId: context.empresaId,
        changes: toJsonValue({
          before: params.before,
          after:
            params.action.endsWith('Many') && params.result
              ? { result: params.result, data: params.args?.data ?? null }
              : params.result,
          where: params.action.endsWith('Many') ? params.args?.where ?? null : undefined,
        }),
        metadata: toJsonValue({
          ip: context.ip,
          userAgent: context.userAgent,
          method: context.method,
          path: context.path,
        }),
      },
    })
  } catch (error) {
    logger.error('Error creating automatic audit log', {
      model: params.model,
      action: params.action,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (!AUDITED_ACTIONS.has(operation)) return query(args)

        const before = await getBeforeSnapshot(model, operation, args)
        const result = await query(args)
        await writeAuditLog({
          model,
          action: operation,
          args,
          result,
          before,
        })
        return result
      },
    },
  },
}) as unknown as PrismaClient

export default prisma
