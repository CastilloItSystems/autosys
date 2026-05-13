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

const MEMBERSHIP_PERMISSION_INCLUDE = {
  role: {
    include: {
      permissions: {
        include: {
          permission: { select: { code: true } },
        },
      },
    },
  },
  permissions: {
    include: {
      permission: { select: { code: true } },
    },
  },
} as const

const getPrisma = async () =>
  (await import('../../services/prisma.service.js')).default

type MembershipWithPermissions = {
  id: string
  empresaId: string
  role: {
    permissions: RolePermissionInput[]
  }
  permissions: MembershipPermissionInput[]
}

function resolveMembershipPermissionSet(
  membership: MembershipWithPermissions
): Set<string> {
  return new Set(
    resolveMembershipPermissions(
      membership.role.permissions,
      membership.permissions
    )
  )
}

export async function getEffectivePermissionsForMembership(
  membershipId: string
): Promise<Set<string>> {
  const prisma = await getPrisma()
  const membership = await prisma.membership.findUnique({
    where: { id: membershipId },
    include: MEMBERSHIP_PERMISSION_INCLUDE,
  })

  if (!membership) return new Set()

  return resolveMembershipPermissionSet(membership)
}

export async function getEffectivePermissionsForUserEmpresa(
  userId: string,
  empresaId: string
): Promise<Set<string>> {
  const prisma = await getPrisma()
  const membership = await prisma.membership.findUnique({
    where: {
      userId_empresaId: {
        userId,
        empresaId,
      },
    },
    include: MEMBERSHIP_PERMISSION_INCLUDE,
  })

  if (!membership || membership.status !== 'active') return new Set()

  return resolveMembershipPermissionSet(membership)
}

export async function userHasPermissionsInEmpresa(
  userId: string,
  empresaId: string,
  requiredPermissions: string[]
): Promise<boolean> {
  const permissions = await getEffectivePermissionsForUserEmpresa(
    userId,
    empresaId
  )

  return requiredPermissions.every((permission) => permissions.has(permission))
}

export async function userHasPermissionsInAnyEmpresa(
  userId: string,
  requiredPermissions: string[]
): Promise<boolean> {
  const prisma = await getPrisma()
  const memberships = await prisma.membership.findMany({
    where: {
      userId,
      status: 'active',
    },
    include: MEMBERSHIP_PERMISSION_INCLUDE,
  })

  return memberships.some((membership) => {
    const permissions = resolveMembershipPermissionSet(membership)
    return requiredPermissions.every((permission) =>
      permissions.has(permission)
    )
  })
}

export async function getEmpresaIdsForUserPermission(
  userId: string,
  requiredPermission: string
): Promise<string[]> {
  const prisma = await getPrisma()
  const memberships = await prisma.membership.findMany({
    where: {
      userId,
      status: 'active',
    },
    include: MEMBERSHIP_PERMISSION_INCLUDE,
  })

  return memberships
    .filter((membership) =>
      resolveMembershipPermissionSet(membership).has(requiredPermission)
    )
    .map((membership) => membership.empresaId)
}
