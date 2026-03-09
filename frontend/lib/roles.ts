// lib/roles.ts

export const PERMISSIONS = {
  INVENTORY_VIEW: "inventory:view",
  INVENTORY_CREATE: "inventory:create",
  INVENTORY_UPDATE: "inventory:update",
  INVENTORY_DELETE: "inventory:delete",
  INVENTORY_APPROVE_HIGH_VARIANCE: "inventory:approve_high_variance",

  ITEMS_VIEW: "items:view",
  ITEMS_CREATE: "items:create",
  ITEMS_UPDATE: "items:update",
  ITEMS_DELETE: "items:delete",

  STOCK_VIEW: "stock:view",
  STOCK_ADJUST: "stock:adjust",
  STOCK_TRANSFER: "stock:transfer",
  TRANSFER_APPROVE: "transfers:approve",

  PO_VIEW: "purchase_orders:view",
  PO_CREATE: "purchase_orders:create",
  PO_APPROVE: "purchase_orders:approve",
  PO_RECEIVE: "purchase_orders:receive",
  PO_CANCEL: "purchase_orders:cancel",

  SALES_VIEW: "sales:view",
  SALES_CREATE: "sales:create",
  SALES_APPROVE: "sales:approve",
  SALES_CANCEL: "sales:cancel",

  EXIT_NOTE_VIEW: "exit_notes:view",
  EXIT_NOTE_CREATE: "exit_notes:create",
  EXIT_NOTE_PREPARE: "exit_notes:prepare",
  EXIT_NOTE_DELIVER: "exit_notes:deliver",

  PAYMENT_VIEW: "payments:view",
  PAYMENT_CREATE: "payments:create",
  PAYMENT_CANCEL: "payments:cancel",

  INVOICE_VIEW: "invoices:view",
  INVOICE_CREATE: "invoices:create",
  INVOICE_CANCEL: "invoices:cancel",

  REPORTS_VIEW: "reports:view",
  REPORTS_EXPORT: "reports:export",

  USERS_VIEW: "users:view",
  USERS_CREATE: "users:create",
  USERS_UPDATE: "users:update",
  USERS_DELETE: "users:delete",

  EMPRESA_VIEW: "empresa:view",
  EMPRESA_CREATE: "empresa:create",
  EMPRESA_UPDATE: "empresa:update",
  EMPRESA_DELETE: "empresa:delete",

  SETTINGS_VIEW: "settings:view",
  SETTINGS_UPDATE: "settings:update",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export type Role =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "GERENTE"
  | "VENDEDOR"
  | "ALMACENISTA"
  | "MECANICO"
  | "CAJERO"
  | "CONTADOR"
  | "ASESOR"
  | "VIEWER";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: Object.values(PERMISSIONS),

  ADMIN: [
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_CREATE,
    PERMISSIONS.INVENTORY_UPDATE,
    PERMISSIONS.ITEMS_VIEW,
    PERMISSIONS.ITEMS_CREATE,
    PERMISSIONS.ITEMS_UPDATE,
    PERMISSIONS.STOCK_VIEW,
    PERMISSIONS.STOCK_ADJUST,
    PERMISSIONS.STOCK_TRANSFER,
    PERMISSIONS.TRANSFER_APPROVE,
    PERMISSIONS.PO_VIEW,
    PERMISSIONS.PO_CREATE,
    PERMISSIONS.PO_APPROVE,
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.SALES_CREATE,
    PERMISSIONS.SALES_APPROVE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.EMPRESA_VIEW,
    PERMISSIONS.EMPRESA_CREATE,
    PERMISSIONS.EMPRESA_UPDATE,
    PERMISSIONS.EMPRESA_DELETE,
  ],

  GERENTE: [
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.ITEMS_VIEW,
    PERMISSIONS.STOCK_VIEW,
    PERMISSIONS.TRANSFER_APPROVE,
    PERMISSIONS.PO_VIEW,
    PERMISSIONS.PO_APPROVE,
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.SALES_APPROVE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
  ],

  VENDEDOR: [
    PERMISSIONS.ITEMS_VIEW,
    PERMISSIONS.STOCK_VIEW,
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.SALES_CREATE,
  ],

  ALMACENISTA: [
    PERMISSIONS.ITEMS_VIEW,
    PERMISSIONS.STOCK_VIEW,
    PERMISSIONS.STOCK_ADJUST,
    PERMISSIONS.STOCK_TRANSFER,
    PERMISSIONS.PO_VIEW,
    PERMISSIONS.PO_RECEIVE,
    PERMISSIONS.EXIT_NOTE_VIEW,
    PERMISSIONS.EXIT_NOTE_PREPARE,
    PERMISSIONS.EXIT_NOTE_DELIVER,
  ],

  MECANICO: [
    PERMISSIONS.ITEMS_VIEW,
    PERMISSIONS.STOCK_VIEW,
    PERMISSIONS.EXIT_NOTE_VIEW,
  ],

  CAJERO: [
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.PAYMENT_VIEW,
    PERMISSIONS.PAYMENT_CREATE,
    PERMISSIONS.INVOICE_VIEW,
    PERMISSIONS.INVOICE_CREATE,
  ],

  CONTADOR: [
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.INVOICE_VIEW,
    PERMISSIONS.PAYMENT_VIEW,
  ],

  ASESOR: [
    PERMISSIONS.ITEMS_VIEW,
    PERMISSIONS.STOCK_VIEW,
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.SALES_CREATE,
  ],

  VIEWER: [
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.ITEMS_VIEW,
    PERMISSIONS.STOCK_VIEW,
    PERMISSIONS.REPORTS_VIEW,
  ],
};

const LEGACY_ROLE_ALIAS: Record<string, Role> = {
  superadmin: "SUPER_ADMIN",
  super_admin: "SUPER_ADMIN",
  admin: "ADMIN",
  gerente: "GERENTE",
  vendedor: "VENDEDOR",
  almacenista: "ALMACENISTA",
  mecanico: "MECANICO",
  cajero: "CAJERO",
  contador: "CONTADOR",
  asesor: "ASESOR",
  viewer: "VIEWER",
  user: "VIEWER",
  lectura: "VIEWER",
  operador: "ADMIN",
};

function normalizeRole(role: string): Role | null {
  if (!role) return null;
  if (ROLE_PERMISSIONS[role as Role]) return role as Role;

  const normalized = role.trim().toLowerCase();
  return LEGACY_ROLE_ALIAS[normalized] ?? null;
}

function normalizeAllowedRole(role: string): string {
  const normalized = normalizeRole(role);
  return normalized ?? role.trim().toLowerCase();
}

function rolesWithPermission(permission: Permission): Role[] {
  return (Object.keys(ROLE_PERMISSIONS) as Role[]).filter((role) =>
    ROLE_PERMISSIONS[role].includes(permission),
  );
}

export const infoAllowedRoles = rolesWithPermission(PERMISSIONS.INVENTORY_VIEW);
export const editAllowedRoles = rolesWithPermission(
  PERMISSIONS.INVENTORY_UPDATE,
);
export const deleteAllowedRoles = rolesWithPermission(
  PERMISSIONS.INVENTORY_DELETE,
);
export const duplicateAllowedRoles = rolesWithPermission(
  PERMISSIONS.INVENTORY_CREATE,
);
export const pdfAllowedRoles = rolesWithPermission(PERMISSIONS.REPORTS_EXPORT);
export const createAllowedRoles = rolesWithPermission(
  PERMISSIONS.INVENTORY_CREATE,
);

export const roleHierarchy: string[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "GERENTE",
  "ALMACENISTA",
  "VENDEDOR",
  "ASESOR",
  "MECANICO",
  "CAJERO",
  "CONTADOR",
  "VIEWER",
];

export function hasRoleOrAbove(
  userRole: string,
  allowedRoles: string[],
): boolean {
  const normalizedUserRole = normalizeAllowedRole(userRole);
  const userIdx = roleHierarchy.indexOf(normalizedUserRole);
  if (userIdx === -1) return false;

  return allowedRoles.some((role) => {
    const allowedIdx = roleHierarchy.indexOf(normalizeAllowedRole(role));
    return allowedIdx !== -1 && userIdx <= allowedIdx;
  });
}

export const protectedRoutes = [
  { path: "/admin", roles: ["ADMIN"] },
  { path: "/dashboard", roles: ["SUPER_ADMIN"] },
  { path: "/users", roles: ["SUPER_ADMIN"] },
  { path: "/todas-refinerias", roles: ["SUPER_ADMIN"] },
  { path: "/refineria/configuracion", roles: ["SUPER_ADMIN", "ADMIN"] },
  { path: "/refineria/finanzas", roles: ["SUPER_ADMIN", "ADMIN"] },
];

export function hasPermission(
  userRoles: string[],
  permission: Permission,
): boolean {
  return userRoles.some((role) => {
    const normalized = normalizeRole(role);
    if (!normalized) return false;
    return ROLE_PERMISSIONS[normalized].includes(permission);
  });
}

export function hasAnyPermission(
  userRoles: string[],
  permissions: Permission[],
): boolean {
  return permissions.some((permission) => hasPermission(userRoles, permission));
}

export function hasRole(allowed: string[], userRoles: string[]): boolean {
  const normalizedAllowed = allowed.map(normalizeAllowedRole);
  const normalizedUserRoles = userRoles.map(normalizeAllowedRole);

  return normalizedAllowed.some((role) => normalizedUserRoles.includes(role));
}
