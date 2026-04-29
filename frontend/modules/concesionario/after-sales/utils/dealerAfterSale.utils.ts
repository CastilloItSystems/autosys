export const AFTER_SALE_TYPE_OPTIONS = [
  { label: "Chequeo de Garantía", value: "WARRANTY_CHECK" },
  { label: "Primer Servicio", value: "FIRST_SERVICE" },
  { label: "Llamada de Satisfacción", value: "SATISFACTION_CALL" },
  { label: "Reclamo", value: "CLAIM" },
];

export const AFTER_SALE_TYPE_FILTER_OPTIONS = [
  { label: "Todos los tipos", value: "" },
  ...AFTER_SALE_TYPE_OPTIONS,
];

export const AFTER_SALE_STATUS_OPTIONS = [
  { label: "Abierto", value: "OPEN" },
  { label: "En Progreso", value: "IN_PROGRESS" },
  { label: "Resuelto", value: "RESOLVED" },
  { label: "Cerrado", value: "CLOSED" },
  { label: "Cancelado", value: "CANCELLED" },
];

export const AFTER_SALE_STATUS_FILTER_OPTIONS = [
  { label: "Todos los estatus", value: "" },
  ...AFTER_SALE_STATUS_OPTIONS,
];

export const AFTER_SALE_STATUS_META: Record<
  string,
  {
    label: string;
    severity: "success" | "info" | "warning" | "danger" | "secondary";
  }
> = {
  OPEN: { label: "Abierto", severity: "warning" },
  IN_PROGRESS: { label: "En Progreso", severity: "info" },
  RESOLVED: { label: "Resuelto", severity: "success" },
  CLOSED: { label: "Cerrado", severity: "secondary" },
  CANCELLED: { label: "Cancelado", severity: "danger" },
};
