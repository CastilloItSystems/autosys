// backend/src/shared/utils/resolvePermissions.ts

interface RolePermissionInput {
  permission: {
    code: string
  }
}

interface MembershipPermissionInput {
  action: 'GRANT' | 'REVOKE'
  permission: {
    code: string
  }
}

/**
 * Calcula los permisos efectivos de una membresía:
 * permisos del rol base + GRANTs individuales - REVOKEs individuales
 */
export function resolveMembershipPermissions(
  rolePermissions: RolePermissionInput[],
  overrides: MembershipPermissionInput[]
): string[] {
  const permissionSet = new Set<string>()

  for (const rp of rolePermissions) {
    permissionSet.add(rp.permission.code)
  }

  for (const override of overrides) {
    if (override.action === 'GRANT') {
      permissionSet.add(override.permission.code)
    } else if (override.action === 'REVOKE') {
      permissionSet.delete(override.permission.code)
    }
  }

  return Array.from(permissionSet)
}
