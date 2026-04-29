export const TEST_DRIVE_STATUS_OPTIONS = [
  { label: "Agendada", value: "SCHEDULED" },
  { label: "Confirmada", value: "CONFIRMED" },
  { label: "Completada", value: "COMPLETED" },
  { label: "No asistió", value: "NO_SHOW" },
  { label: "Cancelada", value: "CANCELLED" },
];

export const TEST_DRIVE_STATUS_FILTER_OPTIONS = [
  { label: "Todos los estatus", value: "" },
  ...TEST_DRIVE_STATUS_OPTIONS,
];

export const TEST_DRIVE_STATUS_META: Record<
  string,
  {
    label: string;
    severity: "success" | "warning" | "danger" | "info" | "secondary";
  }
> = {
  SCHEDULED: { label: "Agendada", severity: "warning" },
  CONFIRMED: { label: "Confirmada", severity: "info" },
  COMPLETED: { label: "Completada", severity: "success" },
  NO_SHOW: { label: "No asistió", severity: "danger" },
  CANCELLED: { label: "Cancelada", severity: "danger" },
};
