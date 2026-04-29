export const DOCUMENT_STATUS_OPTIONS = [
  { label: "Pendiente", value: "PENDING" },
  { label: "Válido", value: "VALID" },
  { label: "Vencido", value: "EXPIRED" },
  { label: "Rechazado", value: "REJECTED" },
];

export const DOCUMENT_STATUS_FILTER_OPTIONS = [
  { label: "Todos los estatus", value: "" },
  ...DOCUMENT_STATUS_OPTIONS,
];

export const DOCUMENT_REF_OPTIONS = [
  { label: "Unidad", value: "UNIT" },
  { label: "Reserva", value: "RESERVATION" },
  { label: "Cotización", value: "QUOTE" },
  { label: "Prueba de Manejo", value: "TEST_DRIVE" },
  { label: "Retoma", value: "TRADE_IN" },
  { label: "Financiamiento", value: "FINANCING" },
  { label: "Entrega", value: "DELIVERY" },
  { label: "Cliente", value: "CUSTOMER" },
];

export const DOCUMENT_STATUS_META: Record<
  string,
  {
    label: string;
    severity: "success" | "warning" | "danger" | "info" | "secondary";
  }
> = {
  PENDING: { label: "Pendiente", severity: "warning" },
  VALID: { label: "Válido", severity: "success" },
  EXPIRED: { label: "Vencido", severity: "danger" },
  REJECTED: { label: "Rechazado", severity: "danger" },
};
