// hooks/useUserRoles.ts
import { useSession } from "next-auth/react";

/**
 * Hook para extraer los roles del usuario autenticado desde next-auth
 */
export function useUserRoles(): string[] {
  const { data: session } = useSession();
  const user = session?.user;

  let userRoles: string[] = [];

  if (user) {
    // Si el rol viene como propiedad directa (tu estructura actual)
    if (typeof user.rol === "string") {
      userRoles = [user.rol];
    }
    // Soporte legacy o futuro para múltiples roles si existiera esa propiedad
    else if (Array.isArray((user as any).roles)) {
      userRoles = (user as any).roles;
    }

    // Soporte para estructura anidada (por si acaso vuelve a cambiar)
    else if ((user as any).usuario) {
      const usuario = (user as any).usuario;
      if (Array.isArray(usuario.roles)) {
        userRoles = usuario.roles;
      } else if (typeof usuario.rol === "string") {
        userRoles = [usuario.rol];
      }
    }
  }
  return userRoles;
}
