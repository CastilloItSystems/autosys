// hooks/useUserRoles.ts
import { useSession } from "next-auth/react";

/**
 * Hook para extraer los roles del usuario autenticado desde next-auth
 */
export function useUserRoles(): string[] {
  const { data: session } = useSession();
  let userRoles: string[] = [];
  if (session?.user && (session.user as any).usuario) {
    const usuario = (session.user as any).usuario;
    if (Array.isArray(usuario.roles)) {
      userRoles = usuario.roles;
    } else if (typeof usuario.rol === "string") {
      userRoles = [usuario.rol];
    }
  }
  return userRoles;
}
