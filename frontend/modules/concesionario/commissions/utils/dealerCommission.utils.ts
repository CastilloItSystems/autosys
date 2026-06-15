import type { DealerCommissionStatus } from "../interfaces/dealerCommission.interface";

type Severity = "success" | "info" | "warning" | "danger" | "secondary";

export const COMMISSION_STATUS_META: Record<
  DealerCommissionStatus,
  { label: string; severity: Severity }
> = {
  PENDING: { label: "Pendiente", severity: "warning" },
  APPROVED: { label: "Aprobada", severity: "info" },
  PAID: { label: "Pagada", severity: "success" },
  CANCELLED: { label: "Anulada", severity: "danger" },
};

export const COMMISSION_STATUS_FILTER_OPTIONS = [
  { label: "Todas", value: "" },
  { label: "Pendiente", value: "PENDING" },
  { label: "Aprobada", value: "APPROVED" },
  { label: "Pagada", value: "PAID" },
  { label: "Anulada", value: "CANCELLED" },
];

export const COMMISSION_STATUS_OPTIONS = [
  { label: "Pendiente", value: "PENDING" },
  { label: "Aprobada", value: "APPROVED" },
  { label: "Pagada", value: "PAID" },
  { label: "Anulada", value: "CANCELLED" },
];

export function formatCommissionAmount(
  value: string | number | null | undefined,
  currency = "USD",
): string {
  const num = Number(value ?? 0);
  try {
    return new Intl.NumberFormat("es-VE", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${num.toFixed(2)} ${currency}`;
  }
}

export function formatCommissionPct(value: string | number | null | undefined): string {
  return `${Number(value ?? 0).toFixed(2)}%`;
}
