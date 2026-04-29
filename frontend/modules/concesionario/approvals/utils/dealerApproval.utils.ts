export const APPROVAL_TYPE_OPTIONS = [
  { label: "Excepción de Descuento", value: "DISCOUNT_EXCEPTION" },
  { label: "Aprobación de Retoma", value: "TRADE_IN_APPROVAL" },
  { label: "Override Financiamiento", value: "FINANCING_OVERRIDE" },
  { label: "Excepción Entrega", value: "DELIVERY_EXCEPTION" },
  { label: "Excepción Documental", value: "DOCUMENT_EXCEPTION" },
];

export const APPROVAL_TYPE_FILTER_OPTIONS = [
  { label: "Todos los tipos", value: "" },
  ...APPROVAL_TYPE_OPTIONS,
];

export const APPROVAL_STATUS_OPTIONS = [
  { label: "Pendiente", value: "PENDING" },
  { label: "Aprobada", value: "APPROVED" },
  { label: "Rechazada", value: "REJECTED" },
  { label: "Cancelada", value: "CANCELLED" },
];

export const APPROVAL_STATUS_FILTER_OPTIONS = [
  { label: "Todos los estatus", value: "" },
  ...APPROVAL_STATUS_OPTIONS,
];

export const APPROVAL_STATUS_META: Record<
  string,
  { label: string; severity: "success" | "warning" | "danger" | "secondary" }
> = {
  PENDING: { label: "Pendiente", severity: "warning" },
  APPROVED: { label: "Aprobada", severity: "success" },
  REJECTED: { label: "Rechazada", severity: "danger" },
  CANCELLED: { label: "Cancelada", severity: "secondary" },
};
