// lib/roles.ts

// Listas de roles permitidos para cada acción
export const infoAllowedRoles = ["superAdmin", "admin"];
export const editAllowedRoles = ["superAdmin", "admin", "operador"];
export const deleteAllowedRoles = ["superAdmin"];
export const duplicateAllowedRoles = ["superAdmin", "admin", "operador"];
export const pdfAllowedRoles = ["superAdmin", "admin", "operador", "user"];
export const createAllowedRoles = ["superAdmin", "admin", "operador"]; // nuevos roles permitidos para crear

// Jerarquía de roles de mayor a menor
export const roleHierarchy = [
  "superAdmin",
  "admin",
  "operador",
  "user",
  "lectura",
];

/**
 * Verifica si el usuario tiene alguno de los roles permitidos o un rol superior en la jerarquía
 */
export function hasRoleOrAbove(
  userRole: string,
  allowedRoles: string[]
): boolean {
  const userIdx = roleHierarchy.indexOf(userRole);
  if (userIdx === -1) return false;
  // Si el usuario tiene un rol igual o superior a cualquiera de los permitidos
  return allowedRoles.some((role) => {
    const allowedIdx = roleHierarchy.indexOf(role);
    return allowedIdx !== -1 && userIdx <= allowedIdx;
  });
}

// Rutas protegidas y sus roles mínimos
export const protectedRoutes = [
  { path: "/admin", roles: ["admin"] },
  { path: "/dashboard", roles: ["superAdmin"] },
  { path: "/users", roles: ["superAdmin"] },
  { path: "/todas-refinerias", roles: ["superAdmin"] },
  { path: "/refineria/configuracion", roles: ["superAdmin", "admin"] },
  { path: "/refineria/finanzas", roles: ["superAdmin", "admin"] },
];

// Función reutilizable para verificar permisos
export function hasRole(allowed: string[], userRoles: string[]): boolean {
  return allowed.some((role) => userRoles.includes(role));
}
