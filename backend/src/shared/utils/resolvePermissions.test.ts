import { describe, expect, test } from '@jest/globals'
import { resolveMembershipPermissions } from './resolvePermissions.js'

describe('resolveMembershipPermissions', () => {
  test('combina permisos base, grants y revokes', () => {
    const permissions = resolveMembershipPermissions(
      [
        { permission: { code: 'inventory.view' } },
        { permission: { code: 'items.view' } },
        { permission: { code: 'items.update' } },
      ],
      [
        { action: 'GRANT', permission: { code: 'stock.adjust' } },
        { action: 'REVOKE', permission: { code: 'items.update' } },
      ]
    )

    expect(new Set(permissions)).toEqual(
      new Set(['inventory.view', 'items.view', 'stock.adjust'])
    )
  })
})
