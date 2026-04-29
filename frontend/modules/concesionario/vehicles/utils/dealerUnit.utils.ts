export const UNIT_CONDITION_OPTIONS = [
  { label: "Nuevo", value: "NEW" },
  { label: "Usado", value: "USED" },
  { label: "Demo", value: "DEMO" },
  { label: "Consignación", value: "CONSIGNMENT" },
];

export const UNIT_CONDITION_FILTER_OPTIONS = [
  { label: "Todas las condiciones", value: "" },
  ...UNIT_CONDITION_OPTIONS,
];

export const UNIT_STATUS_OPTIONS = [
  { label: "Disponible", value: "AVAILABLE" },
  { label: "Reservado", value: "RESERVED" },
  { label: "En Documentación", value: "IN_DOCUMENTATION" },
  { label: "Facturado", value: "INVOICED" },
  { label: "Lista para Entrega", value: "READY_FOR_DELIVERY" },
  { label: "Entregado", value: "DELIVERED" },
  { label: "Bloqueado", value: "BLOCKED" },
];

export const UNIT_STATUS_FILTER_OPTIONS = [
  { label: "Todos los estados", value: "" },
  ...UNIT_STATUS_OPTIONS,
];

export const UNIT_BOOLEAN_OPTIONS = [
  { label: "Sí", value: true },
  { label: "No", value: false },
];

export const UNIT_STATUS_META: Record<
  string,
  {
    label: string;
    severity: "success" | "warning" | "info" | "danger" | "secondary";
  }
> = {
  AVAILABLE: { label: "Disponible", severity: "success" },
  RESERVED: { label: "Reservado", severity: "warning" },
  IN_DOCUMENTATION: { label: "En Documentación", severity: "info" },
  INVOICED: { label: "Facturado", severity: "info" },
  READY_FOR_DELIVERY: { label: "Lista para Entrega", severity: "success" },
  DELIVERED: { label: "Entregado", severity: "success" },
  BLOCKED: { label: "Bloqueado", severity: "danger" },
};

export const UNIT_CONDITION_META: Record<
  string,
  {
    label: string;
    severity: "success" | "warning" | "info" | "danger" | "secondary";
  }
> = {
  NEW: { label: "Nuevo", severity: "success" },
  USED: { label: "Usado", severity: "warning" },
  DEMO: { label: "Demo", severity: "info" },
  CONSIGNMENT: { label: "Consignación", severity: "danger" },
};
