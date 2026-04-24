import type {
  NotificationCompanyPolicyInput,
  NotificationMembershipPreferenceInput,
} from './notifications.interface.js'

type AnyRecord = Record<string, unknown>

const asRecord = (value: unknown): AnyRecord =>
  value && typeof value === 'object' ? (value as AnyRecord) : {}

const asStringOrUndefined = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined

const asBooleanOrUndefined = (value: unknown): boolean | undefined =>
  typeof value === 'boolean' ? value : undefined

const asPositiveIntOrUndefined = (value: unknown): number | undefined => {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined
}

const asNonNegativeIntOrUndefined = (value: unknown): number | undefined => {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined
}

const asBooleanQueryOrUndefined = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}

export class ListNotificationsQueryDTO {
  page?: number
  limit?: number
  read?: boolean
  eventCode?: string
  module?: string
  severity?: string

  constructor(data: unknown) {
    const d = asRecord(data)
    this.page = asPositiveIntOrUndefined(d.page)
    this.limit = asPositiveIntOrUndefined(d.limit)
    this.read = asBooleanQueryOrUndefined(d.read)
    this.eventCode = asStringOrUndefined(d.eventCode)
    this.module = asStringOrUndefined(d.module)
    this.severity = asStringOrUndefined(d.severity)
  }
}

export class UpsertCompanyPoliciesDTO {
  policies: NotificationCompanyPolicyInput[]

  constructor(data: unknown) {
    const d = asRecord(data)
    const raw = Array.isArray(d.policies) ? d.policies : []

    this.policies = raw
      .map((item: unknown) => {
        const p = asRecord(item)
        const eventCode = asStringOrUndefined(p.eventCode)
        if (!eventCode) return null

        const policy: NotificationCompanyPolicyInput = { eventCode }
        const enabled = asBooleanOrUndefined(p.enabled)
        const mandatory = asBooleanOrUndefined(p.mandatory)
        const dedupWindowSec = asNonNegativeIntOrUndefined(p.dedupWindowSec)

        if (enabled !== undefined) policy.enabled = enabled
        if (mandatory !== undefined) policy.mandatory = mandatory
        if (dedupWindowSec !== undefined) policy.dedupWindowSec = dedupWindowSec

        if (Array.isArray(p.requiredPermissionsAny)) {
          policy.requiredPermissionsAny = p.requiredPermissionsAny
            .filter((x): x is string => typeof x === 'string' && x.trim() !== '')
            .map((x) => x.trim())
        }

        return policy
      })
      .filter((p): p is NotificationCompanyPolicyInput => p !== null)
  }
}

export class UpsertPreferencesDTO {
  preferences: NotificationMembershipPreferenceInput[]

  constructor(data: unknown) {
    const d = asRecord(data)
    const raw = Array.isArray(d.preferences) ? d.preferences : []

    this.preferences = raw
      .map((item: unknown) => {
        const p = asRecord(item)
        const eventCode = asStringOrUndefined(p.eventCode)
        if (!eventCode) return null

        return {
          eventCode,
          enabled: typeof p.enabled === 'boolean' ? p.enabled : true,
        }
      })
      .filter((p): p is NotificationMembershipPreferenceInput => p !== null)
  }
}
