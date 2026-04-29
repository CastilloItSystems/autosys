export const DELIVERY_STATUS_OPTIONS = [
  { label: "Programada", value: "SCHEDULED" },
  { label: "Lista", value: "READY" },
  { label: "Entregada", value: "DELIVERED" },
  { label: "Cancelada", value: "CANCELLED" },
];

export const DELIVERY_STATUS_FILTER_OPTIONS = [
  { label: "Todos los estatus", value: "" },
  ...DELIVERY_STATUS_OPTIONS,
];

export const DELIVERY_STATUS_META: Record<
  string,
  {
    label: string;
    severity: "success" | "warning" | "danger" | "info" | "secondary";
  }
> = {
  SCHEDULED: { label: "Programada", severity: "warning" },
  READY: { label: "Lista", severity: "info" },
  DELIVERED: { label: "Entregada", severity: "success" },
  CANCELLED: { label: "Cancelada", severity: "danger" },
};
