// backend/src/shared/utils/resolvePermissions.ts
// Resuelve los permisos finales de un usuario:
// = permisos del rol base + GRANTs individuales - REVOKEs individuales

import { ROLE_PERMISSIONS, Role } from '../constants/permissions.js'

interface UserPermissionOverride {
  permission: string
  action: 'GRANT' | 'REVOKE'
}

/**
 * [LEGACY] Calcula permisos efectivos a partir de un rol estático.
 * Mantener durante transición. Usar resolvePermissionsFromBase para nuevos flujos.
 *
 * @param role      - Nombre del rol base (ej: "VENDEDOR")
 * @param overrides - Overrides individuales de UserPermission
 */
export function resolvePermissions(
  role: string,
  overrides: UserPermissionOverride[]
): string[] {
  const basePermissions = new Set<string>(
    (ROLE_PERMISSIONS[role as Role] ?? []) as string[]
  )

  for (const override of overrides) {
    if (override.action === 'GRANT') {
      basePermissions.add(override.permission)
    } else {
      basePermissions.delete(override.permission)
    }
  }

  return Array.from(basePermissions)
}

/**
 * [NUEVO - Roles Dinámicos] Calcula permisos efectivos a partir de un array base de permisos.
 * Usado cuando el usuario tiene roles dinámicos por empresa (CompanyRole.permissions[]).
 *
 * @param basePermissions - Unión de permissions[] de todos los CompanyRole del usuario
 * @param overrides       - Overrides individuales de UserPermission (GRANT/REVOKE)
 * @returns               - Array de strings con permisos efectivos (sin duplicados)
 */
export function resolvePermissionsFromBase(
  basePermissions: string[],
  overrides: UserPermissionOverride[]
): string[] {
  // Deduplicar permisos base (un usuario puede tener roles en múltiples empresas)
  const permSet = new Set<string>(basePermissions)

  // Aplicar overrides individuales
  for (const override of overrides) {
    if (override.action === 'GRANT') {
      permSet.add(override.permission)
    } else {
      permSet.delete(override.permission)
    }
  }

  return Array.from(permSet)
}
