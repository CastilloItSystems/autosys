export interface PermissionGate {
  permission?: string;
  permissionsAny?: string[];
  permissionsAll?: string[];
  scope?: "active" | "any";
}

export type PermissionAction =
  | "view"
  | "create"
  | "update"
  | "delete"
  | "approve"
  | "receive"
  | "export";

type RoutePermissionRule = {
  prefix: string;
  actions: Partial<Record<PermissionAction, PermissionGate>>;
};

const gate = (
  permission: string,
  scope: PermissionGate["scope"] = "active",
): PermissionGate => ({ permission, scope });

const anyGate = (
  permissionsAny: string[],
  scope: PermissionGate["scope"] = "active",
): PermissionGate => ({
  permissionsAny,
  scope,
});

const crud = (
  prefix: string,
  scope: PermissionGate["scope"] = "active",
): RoutePermissionRule["actions"] => ({
  view: gate(`${prefix}.view`, scope),
  create: gate(`${prefix}.create`, scope),
  update: gate(`${prefix}.update`, scope),
  delete: gate(`${prefix}.delete`, scope),
});

const approvableCrud = (
  prefix: string,
  scope: PermissionGate["scope"] = "active",
): RoutePermissionRule["actions"] => ({
  ...crud(prefix, scope),
  approve: gate(`${prefix}.approve`, scope),
});

const manage = (
  viewPermission: string,
  managePermission: string,
  scope: PermissionGate["scope"] = "active",
): RoutePermissionRule["actions"] => ({
  view: gate(viewPermission, scope),
  create: gate(managePermission, scope),
  update: gate(managePermission, scope),
  delete: gate(managePermission, scope),
});

const purchaseOrderActions: RoutePermissionRule["actions"] = {
  view: gate("purchases.orders.view"),
  create: gate("purchases.orders.create"),
  update: gate("purchases.orders.update"),
  delete: gate("purchases.orders.delete"),
  approve: gate("purchases.orders.approve"),
  receive: gate("purchases.orders.receive"),
};

const purchaseSupplierActions: RoutePermissionRule["actions"] = {
  view: gate("purchases.suppliers.view"),
  create: gate("purchases.suppliers.create"),
  update: gate("purchases.suppliers.update"),
  delete: gate("purchases.suppliers.delete"),
};

const ROUTE_PERMISSION_RULES: RoutePermissionRule[] = [
  { prefix: "/users", actions: crud("platform_users", "any") },
  { prefix: "/empresas", actions: crud("companies", "any") },
  { prefix: "/profile/list", actions: crud("platform_users", "any") },
  { prefix: "/profile/create", actions: { view: gate("platform_users.create", "any"), create: gate("platform_users.create", "any") } },
  { prefix: "/dashboard-sales", actions: { view: gate("reports.view", "any") } },

  { prefix: "/empresa/configuracion/usuarios", actions: approvableCrud("users") },
  { prefix: "/empresa/configuracion/auditoria", actions: { view: gate("audit.view") } },
  {
    prefix: "/empresa/configuracion/notificaciones",
    actions: {
      view: gate("notifications.view"),
      update: gate("notifications.manage_policy"),
    },
  },

  { prefix: "/empresa/ventas/reportes", actions: { view: gate("reports.view"), export: gate("reports.export") } },
  { prefix: "/empresa/ventas", actions: { view: anyGate(["customers.view", "orders.view", "invoices.view", "payments.view", "reports.view"]) } },

  { prefix: "/empresa/compras/proveedores", actions: purchaseSupplierActions },
  { prefix: "/empresa/compras/ordenes-compra", actions: purchaseOrderActions },
  { prefix: "/empresa/compras/reportes/rendimiento-proveedores", actions: { view: gate("reports.view"), export: gate("reports.export") } },
  { prefix: "/empresa/compras", actions: { view: anyGate(["purchases.suppliers.view", "purchases.orders.view", "reports.view"]) } },

  { prefix: "/empresa/inventario/reportes", actions: { view: gate("reports.view"), export: gate("reports.export") } },
  { prefix: "/empresa/inventario/items", actions: approvableCrud("items") },
  { prefix: "/empresa/inventario/almacenes", actions: approvableCrud("warehouses") },
  { prefix: "/empresa/inventario/stock", actions: { view: gate("stock.view"), create: gate("stock.adjust"), update: gate("stock.adjust"), approve: gate("stock.approve") } },
  { prefix: "/empresa/inventario/transferencias", actions: approvableCrud("transfers") },
  { prefix: "/empresa/inventario/prestamos", actions: approvableCrud("loans") },
  { prefix: "/empresa/inventario/movimientos", actions: approvableCrud("movements") },
  { prefix: "/empresa/inventario/clientes", actions: approvableCrud("customers") },
  { prefix: "/empresa/inventario/ordenes-venta", actions: approvableCrud("orders") },
  { prefix: "/empresa/inventario/pre-invoice", actions: approvableCrud("invoices") },
  { prefix: "/empresa/inventario/invoice", actions: approvableCrud("invoices") },
  { prefix: "/empresa/inventario/notas-credito", actions: approvableCrud("invoices") },
  { prefix: "/empresa/inventario/payment", actions: approvableCrud("payments") },
  {
    prefix: "/empresa/inventario/ordenes-compra",
    actions: purchaseOrderActions,
  },
  {
    prefix: "/empresa/inventario/proveedores",
    actions: purchaseSupplierActions,
  },
  { prefix: "/empresa/inventario/ajustes", actions: { view: gate("inventory.view"), create: gate("stock.adjust"), update: gate("stock.adjust"), approve: gate("stock.approve") } },
  { prefix: "/empresa/inventario", actions: approvableCrud("inventory") },

  { prefix: "/empresa/crm/clientes", actions: crud("crm.customers") },
  { prefix: "/empresa/crm/leads", actions: crud("crm.leads") },
  { prefix: "/empresa/crm/oportunidades", actions: crud("crm.opportunities") },
  { prefix: "/empresa/crm/cotizaciones", actions: crud("crm.quotes") },
  { prefix: "/empresa/crm/casos", actions: crud("crm.cases") },
  { prefix: "/empresa/crm/actividades", actions: crud("crm.activities") },
  { prefix: "/empresa/crm/interacciones", actions: crud("crm.interactions") },
  { prefix: "/empresa/crm/campanas", actions: crud("crm.campaigns") },
  { prefix: "/empresa/crm/fidelizacion", actions: crud("crm.loyalty") },
  { prefix: "/empresa/crm", actions: { view: anyGate(["crm.customers.view", "crm.leads.view", "crm.opportunities.view", "crm.loyalty.view"]) } },

  { prefix: "/empresa/workshop", actions: crud("workshop") },

  { prefix: "/empresa/concesionario/approvals", actions: { view: gate("dealer.approve"), update: gate("dealer.approve"), approve: gate("dealer.approve") } },
  { prefix: "/empresa/concesionario/automations", actions: { view: gate("crm.automations.view"), update: gate("crm.automations.run") } },
  { prefix: "/empresa/concesionario/integrations", actions: { view: gate("dealer.view"), update: gate("dealer.update") } },
  { prefix: "/empresa/concesionario/reports", actions: { view: gate("reports.view"), export: gate("reports.export") } },
  { prefix: "/empresa/concesionario", actions: crud("dealer") },

  { prefix: "/empresa/finanzas/cuentas-bancarias", actions: manage("finance.bank_accounts.view", "finance.bank_accounts.manage") },
  { prefix: "/empresa/finanzas/facturas-proveedor", actions: manage("finance.supplier_bills.view", "finance.supplier_bills.manage") },
  { prefix: "/empresa/finanzas/pagos-proveedor", actions: { view: gate("finance.supplier_payments.view"), create: gate("finance.supplier_payments.create"), update: gate("finance.supplier_payments.cancel"), delete: gate("finance.supplier_payments.cancel") } },
  { prefix: "/empresa/finanzas/gastos-recurrentes", actions: manage("finance.view", "finance.recurring_rules.manage") },
  { prefix: "/empresa/finanzas/gastos", actions: manage("finance.expenses.view", "finance.expenses.manage") },
  { prefix: "/empresa/finanzas/flujo-caja", actions: { view: gate("finance.cash_flow.view") } },
  { prefix: "/empresa/finanzas/tipos-cambio", actions: crud("exchange_rates") },
  { prefix: "/empresa/finanzas", actions: { view: gate("finance.view") } },

  {
    prefix: "/empresa",
    actions: {
      view: anyGate([
        "inventory.view",
        "purchases.suppliers.view",
        "purchases.orders.view",
        "customers.view",
        "orders.view",
        "crm.customers.view",
        "workshop.view",
        "dealer.view",
        "finance.view",
      ]),
    },
  },
];

const getGatePermissionCodes = (gate: PermissionGate) => [
  ...(gate.permission ? [gate.permission] : []),
  ...(gate.permissionsAny ?? []),
  ...(gate.permissionsAll ?? []),
];

export const ROUTE_PERMISSION_CODES = Array.from(
  new Set(
    ROUTE_PERMISSION_RULES.flatMap((rule) =>
      Object.values(rule.actions).flatMap((gate) =>
        gate ? getGatePermissionCodes(gate) : [],
      ),
    ),
  ),
);

function normalizePath(pathname: string): string {
  const path = pathname.split("?")[0]?.replace(/\/+$/, "") || "/";
  if (path === "/empresa/finance" || path.startsWith("/empresa/finance/")) {
    return path.replace("/empresa/finance", "/empresa/finanzas");
  }
  return path;
}

export function getPermissionGateForPath(
  pathname: string | null | undefined,
  action: PermissionAction = "view",
): PermissionGate | null {
  if (!pathname) return null;

  const path = normalizePath(pathname);
  const rule = ROUTE_PERMISSION_RULES.find(
    ({ prefix }) => path === prefix || path.startsWith(`${prefix}/`),
  );

  if (!rule) return null;

  return rule.actions[action] ?? rule.actions.view ?? null;
}
