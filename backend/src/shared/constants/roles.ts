// backend/src/shared/constants/roles.ts

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  GERENTE: 'GERENTE',
  VENDEDOR: 'VENDEDOR',
  ALMACENISTA: 'ALMACENISTA',
  MECANICO: 'MECANICO',
  CAJERO: 'CAJERO',
  CONTADOR: 'CONTADOR',
  ASESOR: 'ASESOR',
  VIEWER: 'VIEWER',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ROLE_HIERARCHY: Record<Role, number> = {
  [ROLES.SUPER_ADMIN]: 100,
  [ROLES.ADMIN]: 90,
  [ROLES.GERENTE]: 80,
  [ROLES.CONTADOR]: 70,
  [ROLES.CAJERO]: 60,
  [ROLES.ASESOR]: 50,
  [ROLES.VENDEDOR]: 40,
  [ROLES.ALMACENISTA]: 30,
  [ROLES.MECANICO]: 20,
  [ROLES.VIEWER]: 10,
}

export const ROLE_LABELS: Record<Role, string> = {
  [ROLES.SUPER_ADMIN]: 'Super Administrador',
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.GERENTE]: 'Gerente',
  [ROLES.VENDEDOR]: 'Vendedor',
  [ROLES.ALMACENISTA]: 'Almacenista',
  [ROLES.MECANICO]: 'Mecánico',
  [ROLES.CAJERO]: 'Cajero',
  [ROLES.CONTADOR]: 'Contador',
  [ROLES.ASESOR]: 'Asesor de Servicio',
  [ROLES.VIEWER]: 'Visualizador',
}
