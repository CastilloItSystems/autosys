import type { DealerHistoryItem } from "../services/dealerDashboardService";

export const DASHBOARD_TYPE_CONFIG: Record<
  DealerHistoryItem["type"],
  { label: string; severity: "success" | "info" | "warning" | "danger" }
> = {
  RESERVATION: { label: "Reserva", severity: "info" },
  QUOTE: { label: "Cotización", severity: "success" },
  TEST_DRIVE: { label: "Prueba", severity: "info" },
  TRADE_IN: { label: "Retoma", severity: "warning" },
  FINANCING: { label: "Financ.", severity: "info" },
  DELIVERY: { label: "Entrega", severity: "success" },
};

export const DASHBOARD_STATUS_SEVERITY: Record<
  string,
  "success" | "info" | "warning" | "danger"
> = {
  PENDING: "warning",
  ACTIVE: "info",
  OPEN: "info",
  IN_PROGRESS: "warning",
  APPROVED: "success",
  COMPLETED: "success",
  DELIVERED: "success",
  CANCELLED: "danger",
  REJECTED: "danger",
};

export const formatDashboardDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
