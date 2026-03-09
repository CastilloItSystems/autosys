// backend/src/shared/utils/resolvePermissions.ts
// Resuelve los permisos finales de un usuario:
// = permisos del rol base + GRANTs individuales - REVOKEs individuales

import { ROLE_PERMISSIONS, Role } from '../constants/permissions.js'

interface UserPermissionOverride {
  permission: string
  action: 'GRANT' | 'REVOKE'
}

/**
 * Calcula la lista de permisos efectivos de un usuario.
 *
 * @param role          - Rol base del usuario (ej: "VENDEDOR")
 * @param overrides     - Overrides individuales guardados en UserPermission
 * @returns             - Array de strings con permisos efectivos
 */
export function resolvePermissions(
  role: string,
  overrides: UserPermissionOverride[]
): string[] {
  // 1. Obtener permisos base del rol
  const basePermissions = new Set<string>(
    (ROLE_PERMISSIONS[role as Role] ?? []) as string[]
  )

  // 2. Aplicar overrides individuales
  for (const override of overrides) {
    if (override.action === 'GRANT') {
      basePermissions.add(override.permission)
    } else {
      basePermissions.delete(override.permission)
    }
  }

  return Array.from(basePermissions)
}
