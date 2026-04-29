export const TRADE_IN_STATUS_OPTIONS = [
  { label: "Pendiente", value: "PENDING" },
  { label: "Inspeccionada", value: "INSPECTED" },
  { label: "Valorada", value: "VALUED" },
  { label: "Aprobada", value: "APPROVED" },
  { label: "Rechazada", value: "REJECTED" },
  { label: "Aplicada", value: "APPLIED" },
];

export const TRADE_IN_STATUS_FILTER_OPTIONS = [
  { label: "Todos los estatus", value: "" },
  ...TRADE_IN_STATUS_OPTIONS,
];

export const TRADE_IN_STATUS_META: Record<
  string,
  {
    label: string;
    severity: "success" | "warning" | "danger" | "info" | "secondary";
  }
> = {
  PENDING: { label: "Pendiente", severity: "warning" },
  INSPECTED: { label: "Inspeccionada", severity: "info" },
  VALUED: { label: "Valorada", severity: "info" },
  APPROVED: { label: "Aprobada", severity: "success" },
  REJECTED: { label: "Rechazada", severity: "danger" },
  APPLIED: { label: "Aplicada", severity: "success" },
};
